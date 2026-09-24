import path from 'node:path'

const CAROUSEL_LIMIT = 10

function concise(value, limit) {
  return value.length > limit ? `${value.slice(0, limit - 1)}…` : value
}

function slackEscape(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function mrkdwnText(value, limit) {
  return concise(slackEscape(value), limit)
}

function pluralize(count, singular) {
  return `${count} ${singular}${count === 1 ? '' : 's'}`
}

function stateFor(platforms) {
  if (platforms.some(platform => platform.status === 'cancelled')) {
    return 'cancelled'
  }
  if (platforms.some(platform => platform.failures.length > 0)) {
    return 'failed'
  }
  if (platforms.some(platform => platform.failed)) {
    return 'setup_failed'
  }
  return 'passed'
}

function statePresentation(state, failureCount) {
  if (state === 'cancelled') {
    return {
      header: '⏹️ Nightly Maestro E2E cancelled',
      summary: 'results may be incomplete',
      fallback: 'Nightly Maestro E2E was cancelled. Results may be incomplete.',
    }
  }
  if (state === 'setup_failed') {
    return {
      header: '⚠️ Nightly Maestro setup failed',
      summary: 'no complete test results',
      fallback: 'Nightly Maestro E2E setup failed before tests could complete.',
    }
  }
  if (state === 'failed') {
    return {
      header: '🚨 Nightly Maestro E2E failed',
      summary: `${pluralize(failureCount, 'failed flow')}`,
      fallback: `Nightly Maestro E2E failed with ${pluralize(failureCount, 'failed flow')}.`,
    }
  }
  return {
    header: '✅ Nightly Maestro E2E passed',
    summary: 'all platforms passed',
    fallback: 'Nightly Maestro E2E passed on all platforms.',
  }
}

function platformStatus(platform) {
  if (platform.status === 'cancelled') return '⏹️ Cancelled'
  if (platform.status === 'skipped') return '⏭️ Skipped'
  if (platform.failures.length > 0) {
    return `❌ Failed · ${pluralize(platform.failures.length, 'flow')}`
  }
  if (platform.failed && !platform.hasJUnit) return '⚠️ Setup failed'
  if (platform.failed) return '❌ Failed'
  return '✅ Passed'
}

function selectFailures(platforms, limit = CAROUSEL_LIMIT) {
  const queues = platforms.map(platform =>
    platform.failures.map(failure => ({platform, failure})),
  )
  const selected = []

  while (selected.length < limit && queues.some(queue => queue.length > 0)) {
    for (const queue of queues) {
      const next = queue.shift()
      if (next) selected.push(next)
      if (selected.length === limit) break
    }
  }

  return selected
}

function uploadFilename({platform, failure}, index) {
  const extension = path.extname(failure.screenshot) || '.png'
  const slug = failure.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${index + 1}-${platform.name.toLowerCase()}-${slug || 'failed-flow'}${extension}`
}

function buildUploadPayload(selectedFailures) {
  return {
    file_uploads: selectedFailures
      .filter(({failure}) => failure.screenshot)
      .map((entry, index) => ({
        file: entry.failure.screenshot,
        filename: uploadFilename(entry, index),
        highlight_type: 'png',
        alt_text: `${entry.platform.name} failure screenshot for ${entry.failure.name}`,
      })),
  }
}

function buildThreadPayload(platforms) {
  const lines = ['*All Maestro failure details*']
  for (const platform of platforms) {
    if (platform.failures.length === 0) continue
    lines.push('', `*${slackEscape(platform.name)}*`)
    for (const failure of platform.failures) {
      lines.push(
        `• *${mrkdwnText(failure.name, 140)}*\n  ${mrkdwnText(failure.message, 300)}`,
      )
    }
    if (platform.artifactUrl) {
      lines.push(`<${platform.artifactUrl}|Open ${platform.name} artifacts>`)
    }
  }
  return {text: lines.join('\n')}
}

function buildCarousel(selectedFailures, slackFileIds) {
  let screenshotIndex = 0
  const elements = selectedFailures.map(({platform, failure}, index) => {
    const slackFileId = failure.screenshot
      ? slackFileIds[screenshotIndex++]
      : undefined
    return {
      type: 'card',
      block_id: `maestro_failure_${index + 1}`,
      title: {
        type: 'mrkdwn',
        text: `*${mrkdwnText(failure.name, 140)}*`,
        verbatim: true,
      },
      subtitle: {
        type: 'mrkdwn',
        text: `${platform.name} · failed flow`,
        verbatim: true,
      },
      ...(slackFileId
        ? {
            hero_image: {
              type: 'image',
              slack_file: {id: slackFileId},
              alt_text: `${platform.name} failure screenshot for ${failure.name}`,
            },
          }
        : {}),
      body: {
        type: 'mrkdwn',
        text: mrkdwnText(failure.message, 190),
        verbatim: true,
      },
      ...(platform.artifactUrl
        ? {
            subtext: {
              type: 'mrkdwn',
              text: `<${platform.artifactUrl}|Open logs and artifacts>`,
              verbatim: true,
            },
          }
        : {}),
    }
  })

  return {type: 'carousel', block_id: 'maestro_failures', elements}
}

function diagnosticBlock(platform) {
  const phase = mrkdwnText(
    platform.phase || 'No phase metadata was captured',
    220,
  )
  if (platform.status === 'cancelled') {
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${platform.name} cancelled*\nLatest phase: ${phase}\nResults may be incomplete.`,
      },
    }
  }
  if (!platform.hasJUnit) {
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${platform.name} setup failed*\nLatest phase: ${phase}\nNo JUnit results were produced.`,
      },
    }
  }
  return {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*${platform.name} job failed*\nLatest phase: ${phase}`,
    },
  }
}

function footerBlock(platforms, runUrl) {
  const links = [`<${runUrl}|Open workflow>`]
  for (const platform of platforms) {
    if (platform.artifactUrl) {
      links.push(`<${platform.artifactUrl}|${platform.name} artifacts>`)
    }
  }
  return {
    type: 'section',
    text: {type: 'mrkdwn', text: links.join('  •  ')},
  }
}

export function buildSlackMessage({
  platforms,
  sha,
  runUrl,
  commitUrl,
  slackFileIds = [],
}) {
  const state = stateFor(platforms)
  const failureCount = platforms.reduce(
    (total, platform) => total + platform.failures.length,
    0,
  )
  const presentation = statePresentation(state, failureCount)
  const allFailures = selectFailures(platforms, failureCount)
  const selectedFailures = allFailures.slice(0, CAROUSEL_LIMIT)
  const uploadPayload = buildUploadPayload(allFailures)
  const detailBlocks = platforms
    .filter(
      platform =>
        platform.status === 'cancelled' ||
        (platform.failed && platform.failures.length === 0),
    )
    .map(diagnosticBlock)

  if (selectedFailures.length > 0) {
    detailBlocks.push(buildCarousel(selectedFailures, slackFileIds), {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Showing ${selectedFailures.length} of ${pluralize(failureCount, 'failed flow')}  •  full details and screenshots are in the thread`,
        },
      ],
    })
  }

  const shortSha = sha.slice(0, 12)
  const blocks = [
    {
      type: 'header',
      text: {type: 'plain_text', text: presentation.header},
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Commit <${commitUrl}|\`${shortSha}\`>  •  ${presentation.summary}`,
        },
      ],
    },
    {
      type: 'section',
      fields: platforms.map(platform => ({
        type: 'mrkdwn',
        text: `*${platform.name}*\n${platformStatus(platform)}`,
      })),
    },
    ...(detailBlocks.length > 0 ? [{type: 'divider'}, ...detailBlocks] : []),
    footerBlock(platforms, runUrl),
  ]

  return {
    state,
    failureCount,
    screenshotCount: uploadPayload.file_uploads.length,
    uploadPayload,
    threadPayload: buildThreadPayload(platforms),
    payload: {text: presentation.fallback, blocks},
  }
}

export function extractSlackFileIds(response) {
  if (!response) return []

  let parsed = response
  if (typeof response === 'string') {
    try {
      parsed = JSON.parse(response)
    } catch {
      return []
    }
  }

  const ids = []
  const seen = new Set()
  function visit(value) {
    if (Array.isArray(value)) {
      for (const item of value) visit(item)
      return
    }
    if (!value || typeof value !== 'object') return
    if (
      typeof value.id === 'string' &&
      /^F[A-Z0-9]+$/.test(value.id) &&
      !seen.has(value.id)
    ) {
      seen.add(value.id)
      ids.push(value.id)
    }
    for (const child of Object.values(value)) visit(child)
  }
  visit(parsed)
  return ids
}
