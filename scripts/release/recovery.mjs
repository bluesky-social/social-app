import {execFileSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {appendFileSync, readFileSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'

const platforms = {
  ios: {filename: 'Bluesky.ipa', number: 'buildNumber'},
  android: {filename: 'build.aab', number: 'versionCode'},
}

function requireValue(condition, message) {
  if (!condition) throw new Error(message)
}

function readJson(path) {
  const value = JSON.parse(readFileSync(path, 'utf8'))
  requireValue(
    value !== null && typeof value === 'object' && !Array.isArray(value),
    `Invalid checkpoint object: ${path}`,
  )
  return value
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, {flag: 'wx'})
}

function output(name, value) {
  requireValue(!/[\r\n]/.test(String(value)), `Invalid output ${name}`)
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`)
  }
  console.log(`${name}=${value}`)
}

/** Missing evidence is different from evidence that exists but cannot be used. */
export function findArtifact(pages, name) {
  const matches = pages.flatMap(page => {
    requireValue(Array.isArray(page.artifacts), 'Invalid artifact API response')
    return page.artifacts.filter(artifact => artifact.name === name)
  })
  requireValue(matches.length <= 1, `Multiple artifacts named ${name}`)
  const artifact = matches[0]
  if (!artifact) return undefined
  requireValue(artifact.expired === false, `Artifact ${name} has expired`)
  requireValue(
    Number.isSafeInteger(artifact.id) && artifact.id > 0,
    'Invalid artifact ID',
  )
  return artifact.id
}

/** Bind every checkpoint to the run, platform, profile, and exact source. */
export function validateIdentity(actual, expected) {
  requireValue(
    actual.schemaVersion === 1,
    'Unsupported recovery metadata schema',
  )
  requireValue(Object.hasOwn(platforms, actual.platform), 'Invalid platform')
  requireValue(
    typeof actual.sourceSha === 'string' &&
      /^[0-9a-f]{40}$/.test(actual.sourceSha),
    'Invalid source SHA',
  )
  requireValue(
    typeof actual.packageVersion === 'string' &&
      /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/.test(
        actual.packageVersion,
      ),
    'Invalid package version',
  )
  requireValue(
    typeof actual.runId === 'string' && /^[1-9][0-9]*$/.test(actual.runId),
    'Invalid run ID',
  )
  requireValue(
    typeof actual.profile === 'string' &&
      /^[a-z][a-z0-9-]*$/.test(actual.profile),
    'Invalid build profile',
  )
  for (const key of [
    'runId',
    'platform',
    'profile',
    'sourceSha',
    'packageVersion',
  ]) {
    requireValue(
      actual[key] === expected[key],
      `Recovery identity mismatch: ${key}`,
    )
  }
  return actual
}

/** Verify bytes as well as labels before reusing or submitting a native build. */
export function verifyBuild(directory, expected) {
  const metadata = validateIdentity(
    readJson(join(directory, `${expected.platform}-build-metadata.json`)),
    expected,
  )
  const platform = platforms[metadata.platform]
  requireValue(
    metadata.artifactFilename === platform.filename,
    'Unexpected artifact filename',
  )
  requireValue(
    typeof metadata[platform.number] === 'string' &&
      /^[1-9][0-9]*$/.test(metadata[platform.number]),
    'Invalid native build number',
  )
  requireValue(
    metadata.submissionState === 'notStarted',
    'Invalid build checkpoint state',
  )
  requireValue(
    typeof metadata.artifactSha256 === 'string' &&
      /^[0-9a-f]{64}$/.test(metadata.artifactSha256),
    'Invalid artifact checksum',
  )
  const checksum = createHash('sha256')
    .update(readFileSync(join(directory, platform.filename)))
    .digest('hex')
  requireValue(
    checksum === metadata.artifactSha256,
    'Native artifact checksum mismatch',
  )
  if (metadata.platform === 'ios') {
    const symbols = createHash('sha256')
      .update(readFileSync(join(directory, 'Bluesky.app.dSYM.zip')))
      .digest('hex')
    requireValue(symbols === metadata.symbolsSha256, 'dSYM checksum mismatch')
  }
  return metadata
}

/** An interrupted submission must be reconciled with the store, never guessed. */
export function submissionDecision(build, intent, receipt) {
  for (const [checkpoint, state] of [
    [intent, 'started'],
    [receipt, 'submitted'],
  ]) {
    if (!checkpoint) continue
    validateIdentity(checkpoint, build)
    for (const key of ['artifactSha256', platforms[build.platform].number]) {
      requireValue(
        checkpoint[key] === build[key],
        `Submission checkpoint mismatch: ${key}`,
      )
    }
    requireValue(
      checkpoint.submissionState === state,
      `Invalid submission state: expected ${state}`,
    )
  }
  if (receipt) return 'reused'
  requireValue(
    !intent,
    'Submission outcome is unknown. Inspect the original EAS submission and store before any further upload; automatic resubmission is blocked.',
  )
  return 'submit'
}

function expectedIdentity() {
  return {
    schemaVersion: 1,
    runId: process.env.GITHUB_RUN_ID,
    platform: process.env.RELEASE_PLATFORM,
    profile: process.env.RELEASE_PROFILE,
    sourceSha: process.env.RELEASE_SOURCE_SHA,
    packageVersion: process.env.RELEASE_PACKAGE_VERSION,
  }
}

function buildOutputs(metadata) {
  output('package-version', metadata.packageVersion)
  output('build-number', metadata[platforms[metadata.platform].number])
  output('source-sha', metadata.sourceSha)
}

export function run([command, ...args]) {
  const expected = expectedIdentity()
  switch (command) {
    case 'source': {
      validateIdentity(expected, expected)
      const [directory, restored] = args
      const path = join(directory, `${expected.platform}-source.json`)
      if (restored === 'true') {
        validateIdentity(readJson(path), expected)
      } else {
        writeJson(path, expected)
      }
      break
    }
    case 'lookup': {
      const [name] = args
      requireValue(
        name &&
          process.env.GITHUB_REPOSITORY &&
          /^[1-9][0-9]*$/.test(process.env.GITHUB_RUN_ID),
        'Missing artifact lookup identity',
      )
      const endpoint = `repos/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}/artifacts?per_page=100`
      const pages = JSON.parse(
        execFileSync('gh', ['api', '--paginate', '--slurp', endpoint], {
          encoding: 'utf8',
        }),
      )
      output('artifact-id', findArtifact(pages, name) ?? '')
      break
    }
    case 'record-build': {
      validateIdentity(expected, expected)
      const [directory, number] = args
      const {filename, number: numberKey} = platforms[expected.platform]
      const metadata = {
        ...expected,
        [numberKey]: number,
        artifactFilename: filename,
        artifactSha256: createHash('sha256')
          .update(readFileSync(join(directory, filename)))
          .digest('hex'),
        submissionState: 'notStarted',
      }
      if (expected.platform === 'ios') {
        metadata.symbolsSha256 = createHash('sha256')
          .update(readFileSync(join(directory, 'Bluesky.app.dSYM.zip')))
          .digest('hex')
      }
      writeJson(
        join(directory, `${expected.platform}-build-metadata.json`),
        metadata,
      )
      verifyBuild(directory, expected)
      break
    }
    case 'verify-build': {
      buildOutputs(verifyBuild(args[0], expected))
      break
    }
    case 'submission': {
      const [directory, intentFile, receiptFile] = args
      const build = verifyBuild(directory, expected)
      const decision = submissionDecision(
        build,
        intentFile === '-' ? undefined : readJson(intentFile),
        receiptFile === '-' ? undefined : readJson(receiptFile),
      )
      output('state', decision)
      if (decision === 'submit')
        writeJson(`${expected.platform}-submission-intent.json`, {
          ...build,
          submissionState: 'started',
        })
      break
    }
    case 'receipt': {
      const build = verifyBuild(args[0], expected)
      writeJson(`${expected.platform}-submission.json`, {
        ...build,
        submissionState: 'submitted',
      })
      break
    }
    default:
      throw new Error(`Unknown recovery command: ${command}`)
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    run(process.argv.slice(2))
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
