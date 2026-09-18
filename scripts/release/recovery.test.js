/* oxlint-disable import/no-nodejs-modules -- This suite exercises a Node CLI with filesystem fixtures. */
import {spawnSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {
  chmodSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import {tmpdir} from 'node:os'
import {join, resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

const moduleUrl = pathToFileURL(resolve('scripts/release/recovery.mjs')).href
const identity = {
  schemaVersion: 1,
  runId: '1234',
  platform: 'android',
  profile: 'production',
  sourceSha: 'a'.repeat(40),
  packageVersion: '1.133.0',
}
const build = {
  ...identity,
  versionCode: '42',
  artifactFilename: 'build.aab',
  artifactSha256: createHash('sha256').update('native bytes').digest('hex'),
  submissionState: 'notStarted',
}
const intent = {...build, submissionState: 'started'}
const receipt = {...build, submissionState: 'submitted'}

/**
 * Exercise the actual ESM helper in Node without the app's Babel transforms.
 * @returns {{value?: unknown, error?: string}}
 */
function call(name, args) {
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
    import * as recovery from ${JSON.stringify(moduleUrl)}
    import {readFileSync} from 'node:fs'
    try {
      const value = recovery[${JSON.stringify(name)}](...JSON.parse(readFileSync(0, 'utf8')))
      process.stdout.write(JSON.stringify({value}))
    } catch (error) {
      process.stdout.write(JSON.stringify({error: error.message}))
    }
  `,
    ],
    {input: JSON.stringify(args), encoding: 'utf8'},
  )
  if (result.status !== 0) throw new Error(result.stderr)
  return JSON.parse(result.stdout)
}

let directory
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'release-recovery-'))
})
afterEach(() => rmSync(directory, {recursive: true, force: true}))

function fixture(metadata = build) {
  writeFileSync(join(directory, metadata.artifactFilename), 'native bytes')
  writeFileSync(
    join(directory, `${metadata.platform}-build-metadata.json`),
    JSON.stringify(metadata),
  )
}

function cli(args, env = {}) {
  return spawnSync(
    process.execPath,
    [resolve('scripts/release/recovery.mjs'), ...args],
    {
      cwd: directory,
      encoding: 'utf8',
      env: {
        ...process.env,
        GITHUB_OUTPUT: join(directory, 'outputs'),
        GITHUB_RUN_ID: identity.runId,
        RELEASE_PLATFORM: identity.platform,
        RELEASE_PROFILE: identity.profile,
        RELEASE_SOURCE_SHA: identity.sourceSha,
        RELEASE_PACKAGE_VERSION: identity.packageVersion,
        ...env,
      },
    },
  )
}

test('artifact lookup searches every page and distinguishes absence', () => {
  const artifact = {name: 'build', id: 17, expired: false}
  expect(
    call('findArtifact', [[{artifacts: []}, {artifacts: [artifact]}], 'build']),
  ).toEqual({value: 17})
  expect(call('findArtifact', [[{artifacts: [artifact]}], 'missing'])).toEqual(
    {},
  )
})

test.each([
  [[{artifacts: [{name: 'build', id: 17, expired: true}]}], 'expired'],
  [
    [
      {
        artifacts: [
          {name: 'build', id: 17, expired: false},
          {name: 'build', id: 18, expired: false},
        ],
      },
    ],
    'Multiple',
  ],
  [
    [{artifacts: [{name: 'build', id: 'bad', expired: false}]}],
    'Invalid artifact ID',
  ],
  [[{}], 'Invalid artifact API response'],
])('unusable artifact evidence fails closed: %j', (pages, error) => {
  expect(call('findArtifact', [pages, 'build']).error).toContain(error)
})

test('a fresh submission is allowed, a matching receipt is reused', () => {
  expect(call('submissionDecision', [build, null, null])).toEqual({
    value: 'submit',
  })
  expect(call('submissionDecision', [build, intent, receipt])).toEqual({
    value: 'reused',
  })
  expect(call('submissionDecision', [build, null, receipt])).toEqual({
    value: 'reused',
  })
})

test('an interruption after submission intent blocks automatic resubmission', () => {
  expect(call('submissionDecision', [build, intent, null]).error).toContain(
    'outcome is unknown',
  )
})

test.each([
  ['sourceSha', 'b'.repeat(40)],
  ['profile', 'testflight-android'],
  ['runId', '5678'],
  ['platform', 'ios'],
  ['packageVersion', '1.134.0'],
  ['artifactSha256', 'b'.repeat(64)],
  ['versionCode', '43'],
  ['submissionState', 'started'],
  ['schemaVersion', 2],
])('rejects mismatched submission receipt: %s', (key, value) => {
  expect(
    call('submissionDecision', [build, intent, {...receipt, [key]: value}])
      .error,
  ).toBeTruthy()
})

test('a valid receipt does not hide a conflicting intent', () => {
  expect(
    call('submissionDecision', [
      build,
      {...intent, artifactSha256: 'b'.repeat(64)},
      receipt,
    ]).error,
  ).toContain('artifactSha256')
})

test('verifies Android bytes and restores original outputs', () => {
  fixture()
  expect(call('verifyBuild', [directory, identity])).toEqual({value: build})
  const result = cli(['verify-build', directory])
  expect(result.status).toBe(0)
  expect(readFileSync(join(directory, 'outputs'), 'utf8')).toBe(
    `package-version=1.133.0\nbuild-number=42\nsource-sha=${identity.sourceSha}\n`,
  )
})

test('rejects corrupted bytes even when metadata matches', () => {
  fixture()
  writeFileSync(join(directory, 'build.aab'), 'different bytes')
  expect(call('verifyBuild', [directory, identity]).error).toContain(
    'checksum mismatch',
  )
})

test.each([
  ['versionCode', '0'],
  ['versionCode', '-1'],
  ['versionCode', 42],
  ['artifactFilename', '../build.aab'],
  ['artifactSha256', 'not-a-checksum'],
  ['submissionState', 'submitted'],
])('rejects invalid build metadata: %s = %j', (key, value) => {
  fixture()
  writeFileSync(
    join(directory, 'android-build-metadata.json'),
    JSON.stringify({...build, [key]: value}),
  )
  expect(call('verifyBuild', [directory, identity]).error).toBeTruthy()
})

test('checks both IPA and dSYM bytes in the flat iOS artifact layout', () => {
  const ios = {...identity, platform: 'ios', profile: 'production'}
  const metadata = {
    ...ios,
    artifactFilename: 'Bluesky.ipa',
    artifactSha256: build.artifactSha256,
    buildNumber: '72',
    submissionState: 'notStarted',
    symbolsSha256: createHash('sha256').update('symbols').digest('hex'),
  }
  fixture(metadata)
  writeFileSync(join(directory, 'Bluesky.app.dSYM.zip'), 'symbols')
  expect(call('verifyBuild', [directory, ios])).toEqual({value: metadata})
  writeFileSync(join(directory, 'Bluesky.app.dSYM.zip'), 'wrong symbols')
  expect(call('verifyBuild', [directory, ios]).error).toContain(
    'dSYM checksum mismatch',
  )
})

test('missing and malformed build metadata cannot be reused', () => {
  expect(call('verifyBuild', [directory, identity]).error).toBeTruthy()
  writeFileSync(join(directory, 'android-build-metadata.json'), '{broken')
  expect(call('verifyBuild', [directory, identity]).error).toBeTruthy()
})

test('source checkpoint rejects a moved ref without modifying the checkpoint', () => {
  expect(cli(['source', directory, 'false']).status).toBe(0)
  const before = readFileSync(join(directory, 'android-source.json'), 'utf8')
  expect(cli(['source', directory, 'true']).status).toBe(0)
  const moved = cli(['source', directory, 'true'], {
    RELEASE_SOURCE_SHA: 'b'.repeat(40),
  })
  expect(moved.status).toBe(1)
  expect(moved.stderr).toContain('sourceSha')
  expect(readFileSync(join(directory, 'android-source.json'), 'utf8')).toBe(
    before,
  )
})

test('CLI records intent, blocks uncertain retry, then reuses a confirmed receipt', () => {
  fixture()
  expect(cli(['submission', directory, '-', '-']).status).toBe(0)
  const intentPath = join(directory, 'android-submission-intent.json')
  expect(JSON.parse(readFileSync(intentPath, 'utf8'))).toMatchObject({
    submissionState: 'started',
  })
  expect(cli(['submission', directory, intentPath, '-']).status).toBe(1)
  expect(cli(['receipt', directory]).status).toBe(0)
  expect(
    cli([
      'submission',
      directory,
      intentPath,
      join(directory, 'android-submission.json'),
    ]).stdout,
  ).toContain('state=reused')
})

test('record-build writes verifiable metadata and never overwrites a checkpoint', () => {
  writeFileSync(join(directory, 'build.aab'), 'native bytes')
  expect(cli(['record-build', directory, '42']).status).toBe(0)
  expect(call('verifyBuild', [directory, identity])).toEqual({value: build})
  expect(cli(['record-build', directory, '43']).status).toBe(1)
  expect(call('verifyBuild', [directory, identity])).toEqual({value: build})
})

test('artifact API failure cannot be interpreted as permission to rebuild or resubmit', () => {
  const gh = join(directory, 'gh')
  writeFileSync(gh, '#!/bin/sh\necho "API unavailable" >&2\nexit 1\n')
  chmodSync(gh, 0o755)
  const result = cli(['lookup', 'android-aab-1234'], {
    PATH: `${directory}:${process.env.PATH}`,
    GITHUB_REPOSITORY: 'bluesky-social/social-app',
  })
  expect(result.status).toBe(1)
  expect(result.stderr).toContain('API unavailable')
  expect(result.stdout).not.toContain('artifact-id=')
})

test.each(['null', 'false', '0', '""', '[]'])(
  'an existing but invalid submission checkpoint cannot count as absent: %s',
  content => {
    fixture()
    const checkpoint = join(directory, 'invalid.json')
    writeFileSync(checkpoint, content)
    const result = cli(['submission', directory, checkpoint, '-'])
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Invalid checkpoint object')
    expect(result.stdout).not.toContain('state=submit')
  },
)
