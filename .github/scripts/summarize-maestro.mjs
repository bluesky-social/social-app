import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const ENTITY_REPLACEMENTS = {
  '&amp;': '&',
  '&apos;': "'",
  '&gt;': '>',
  '&lt;': '<',
  '&quot;': '"',
}

function decodeXml(value = '') {
  return value
    .replace(/&(amp|apos|gt|lt|quot);/g, entity => ENTITY_REPLACEMENTS[entity])
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
}

function attributes(source = '') {
  const result = {}
  for (const match of source.matchAll(/([\w:.-]+)\s*=\s*(["'])(.*?)\2/gs)) {
    result[match[1]] = decodeXml(match[3])
  }
  return result
}

function concise(value, limit = 300) {
  const normalized = decodeXml(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return normalized.length > limit
    ? `${normalized.slice(0, limit - 1)}…`
    : normalized
}

export function parseJUnit(xml) {
  const failures = []
  const testcasePattern = /<testcase\b([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/gi

  for (const match of xml.matchAll(testcasePattern)) {
    const testcase = attributes(match[1])
    const body = match[2] || ''
    const failure = body.match(/<(failure|error)\b([^>]*)>([\s\S]*?)<\/\1>/i)
    const selfClosingFailure = body.match(/<(failure|error)\b([^>]*)\/>/i)
    const failureMatch = failure || selfClosingFailure
    if (!failureMatch) continue

    const failureAttributes = attributes(failureMatch[2])
    const name = testcase.name || testcase.classname || 'Unnamed Maestro flow'
    const message = concise(
      failureAttributes.message || (failure ? failureMatch[3] : '') || 'Failed',
    )
    failures.push({name, message})
  }

  if (failures.length === 0) {
    const suite = xml.match(/<testsuite\b([^>]*)>/i)
    const suiteAttributes = attributes(suite?.[1])
    if (
      Number(suiteAttributes.failures || 0) +
        Number(suiteAttributes.errors || 0) >
      0
    ) {
      failures.push({
        name: suiteAttributes.name || 'Maestro test suite',
        message: 'JUnit reported a failure without testcase details',
      })
    }
  }

  return failures
}

export function parseMaestroCli(log) {
  const failures = []
  const failurePattern = /^\[Failed\]\s+(.+?)\s+\([^)]*\)\s+\((.+)\)\s*$/gm
  for (const match of log.matchAll(failurePattern)) {
    failures.push({
      name: concise(match[1], 120),
      message: concise(match[2]),
    })
  }
  return failures
}

function walk(root) {
  if (!root || !fs.existsSync(root)) return []
  const entries = fs.readdirSync(root, {withFileTypes: true})
  return entries.flatMap(entry => {
    const candidate = path.join(root, entry.name)
    return entry.isDirectory() ? walk(candidate) : [candidate]
  })
}

function readPhase(root) {
  const phaseFile = walk(root).find(file => path.basename(file) === 'phase.txt')
  return phaseFile ? fs.readFileSync(phaseFile, 'utf8').trim() : ''
}

function platformResult({name, status, root, artifactUrl}) {
  const files = walk(root)
  const reports = files.filter(file => /(?:report|junit).*\.xml$/i.test(file))
  const junitFailures = reports.flatMap(report =>
    parseJUnit(fs.readFileSync(report, 'utf8')),
  )
  const maestroLogs = files.filter(
    file => path.basename(file) === 'maestro-cli.log',
  )
  const cliFailures = maestroLogs.flatMap(log =>
    parseMaestroCli(fs.readFileSync(log, 'utf8')),
  )
  // A cancelled or timed-out Maestro run may never flush JUnit. Its CLI log is
  // streamed continuously, so use those failure lines when JUnit has no detail.
  const failures = junitFailures.length > 0 ? junitFailures : cliFailures
  const failed = status !== 'success' || failures.length > 0
  return {
    name,
    status,
    failed,
    failures,
    phase: readPhase(root),
    hasJUnit: reports.length > 0,
    artifactUrl,
  }
}

function statusEmoji(status) {
  return status === 'success' ? ':white_check_mark:' : ':x:'
}

function slackEscape(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function platformBlock(platform) {
  const lines = [
    `${statusEmoji(platform.status)} *${platform.name}* — job status: \`${platform.status}\``,
  ]
  if (platform.failures.length > 0) {
    for (const failure of platform.failures.slice(0, 8)) {
      lines.push(
        `• *${slackEscape(failure.name)}:* ${slackEscape(failure.message)}`,
      )
    }
    if (platform.failures.length > 8) {
      lines.push(`• …and ${platform.failures.length - 8} more failed flows`)
    }
  } else if (platform.failed && !platform.hasJUnit) {
    lines.push(
      `• *Setup phase:* ${slackEscape(platform.phase || 'No phase metadata was captured')}`,
    )
  } else if (platform.failed) {
    lines.push(
      `• Job failed after JUnit was written; latest phase: ${slackEscape(platform.phase || 'unknown')}`,
    )
  }
  if (platform.artifactUrl) {
    lines.push(
      `• <${platform.artifactUrl}|Open ${platform.name} logs and artifacts>`,
    )
  }
  return lines.join('\n').slice(0, 3000)
}

function githubSummary({notify, platforms, shortSha, runUrl, commitUrl}) {
  const lines = [
    `# Nightly Maestro E2E ${notify ? 'failed' : 'passed'}`,
    '',
    `- Commit: [\`${shortSha}\`](${commitUrl})`,
    `- Workflow run: [open run](${runUrl})`,
    '',
  ]

  for (const platform of platforms) {
    lines.push(
      `## ${platform.status === 'success' ? '✅' : '❌'} ${platform.name}`,
      '',
      `Job status: \`${platform.status}\``,
      '',
    )
    if (platform.failures.length > 0) {
      for (const failure of platform.failures.slice(0, 10)) {
        lines.push(`- **${failure.name}:** ${failure.message}`)
      }
      if (platform.failures.length > 10) {
        lines.push(`- …and ${platform.failures.length - 10} more failed flows`)
      }
      lines.push('')
    } else if (platform.failed && !platform.hasJUnit) {
      lines.push(
        `- Setup phase: ${platform.phase || 'No phase metadata was captured'}`,
        '',
      )
    } else if (platform.failed) {
      lines.push(
        `- The job failed after JUnit was written (latest phase: ${platform.phase || 'unknown'})`,
        '',
      )
    }
    if (platform.artifactUrl) {
      lines.push(
        `- [${platform.name} logs and artifacts](${platform.artifactUrl})`,
        '',
      )
    }
  }

  return lines.join('\n').trim()
}

export function buildSummary({
  iosStatus,
  androidStatus,
  iosRoot,
  androidRoot,
  artifactUrls = {},
  sha,
  runUrl,
  commitUrl,
}) {
  const platforms = [
    platformResult({
      name: 'iOS',
      status: iosStatus,
      root: iosRoot,
      artifactUrl: artifactUrls.ios,
    }),
    platformResult({
      name: 'Android',
      status: androidStatus,
      root: androidRoot,
      artifactUrl: artifactUrls.android,
    }),
  ]
  const notify = platforms.some(platform => platform.failed)
  const shortSha = sha.slice(0, 12)
  const lines = [
    ':rotating_light: *Nightly Maestro E2E failed*',
    `*Commit:* <${commitUrl}|\`${shortSha}\`>`,
    `*Workflow run:* <${runUrl}|open run>`,
    '',
  ]

  for (const platform of platforms) {
    lines.push(
      `${statusEmoji(platform.status)} *${platform.name}* — job status: \`${platform.status}\``,
    )
    if (platform.failures.length > 0) {
      for (const failure of platform.failures.slice(0, 10)) {
        lines.push(
          `• *${slackEscape(failure.name)}:* ${slackEscape(failure.message)}`,
        )
      }
      if (platform.failures.length > 10) {
        lines.push(`• …and ${platform.failures.length - 10} more failed flows`)
      }
    } else if (platform.failed && !platform.hasJUnit) {
      lines.push(
        `• Setup phase: ${platform.phase || 'No phase metadata was captured'}`,
      )
    } else if (platform.failed) {
      lines.push(
        `• The job failed after JUnit was written (latest phase: ${platform.phase || 'unknown'})`,
      )
    }
    if (platform.artifactUrl) {
      lines.push(
        `• <${platform.artifactUrl}|${platform.name} logs and artifacts>`,
      )
    }
    lines.push('')
  }

  const text = lines.join('\n').trim()
  const blocks = [
    {
      type: 'header',
      text: {type: 'plain_text', text: 'Nightly Maestro E2E failed'},
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Commit:* <${commitUrl}|\`${shortSha}\`>\n*Workflow run:* <${runUrl}|open run>`,
      },
    },
    {type: 'divider'},
    ...platforms.flatMap((platform, index) => [
      {type: 'section', text: {type: 'mrkdwn', text: platformBlock(platform)}},
      ...(index < platforms.length - 1 ? [{type: 'divider'}] : []),
    ]),
  ]
  return {
    notify,
    platforms,
    githubSummary: githubSummary({
      notify,
      platforms,
      shortSha,
      runUrl,
      commitUrl,
    }),
    payload: {text, blocks},
  }
}

function parseArgs(argv) {
  const result = {}
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]
    if (!key?.startsWith('--') || argv[i + 1] === undefined) {
      throw new Error(`Invalid argument: ${key || '<missing>'}`)
    }
    result[key.slice(2)] = argv[i + 1]
  }
  return result
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(import.meta.filename)
) {
  const args = parseArgs(process.argv.slice(2))
  const artifactUrls = args['artifact-urls']
    ? JSON.parse(fs.readFileSync(args['artifact-urls'], 'utf8'))
    : {}
  const summary = buildSummary({
    iosStatus: args['ios-status'],
    androidStatus: args['android-status'],
    iosRoot: args['ios-root'],
    androidRoot: args['android-root'],
    artifactUrls,
    sha: args.sha,
    runUrl: args['run-url'],
    commitUrl: args['commit-url'],
  })
  process.stdout.write(`${JSON.stringify(summary)}\n`)
}
