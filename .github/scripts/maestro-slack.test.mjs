import assert from 'node:assert/strict'
import test from 'node:test'

import {buildSlackMessage, extractSlackFileIds} from './maestro-slack.mjs'
import {screenshotsByFlow} from './summarize-maestro.mjs'

function platform({
  name,
  status = 'success',
  failed = false,
  failures = [],
  phase = 'Completed',
  hasJUnit = true,
}) {
  return {
    name,
    status,
    failed,
    failures,
    phase,
    hasJUnit,
    artifactUrl: `https://example.com/${name.toLowerCase()}`,
  }
}

function build(platforms, slackFileIds = []) {
  return buildSlackMessage({
    platforms,
    sha: '1234567890abcdef',
    runUrl: 'https://example.com/run',
    commitUrl: 'https://example.com/commit',
    slackFileIds,
  })
}

test('builds a screenshot carousel for failed flows', () => {
  const platforms = [
    platform({
      name: 'iOS',
      status: 'failure',
      failed: true,
      failures: [
        {
          name: 'composer',
          message: 'Element not found',
          screenshot: '/tmp/screenshot-(composer).png',
        },
      ],
    }),
    platform({name: 'Android'}),
  ]
  const summary = build(platforms, ['F123ABC'])
  const carousel = summary.payload.blocks.find(
    block => block.type === 'carousel',
  )

  assert.equal(summary.state, 'failed')
  assert.equal(summary.screenshotCount, 1)
  assert.equal(
    summary.uploadPayload.file_uploads[0].file,
    platforms[0].failures[0].screenshot,
  )
  assert.equal(summary.uploadPayload.file_uploads[0].highlight_type, 'png')
  assert.deepEqual(carousel.elements[0].hero_image.slack_file, {id: 'F123ABC'})
})

test('selects failures across both platforms for the carousel', () => {
  const failures = prefix =>
    Array.from({length: 7}, (_, index) => ({
      name: `${prefix}-${index}`,
      message: 'Failed',
      screenshot: `/tmp/${prefix}-${index}.png`,
    }))
  const summary = build([
    platform({
      name: 'iOS',
      status: 'failure',
      failed: true,
      failures: failures('ios'),
    }),
    platform({
      name: 'Android',
      status: 'failure',
      failed: true,
      failures: failures('android'),
    }),
  ])
  const carousel = summary.payload.blocks.find(
    block => block.type === 'carousel',
  )

  assert.equal(carousel.elements.length, 10)
  assert.equal(summary.failureCount, 14)
  assert.equal(summary.screenshotCount, 14)
  assert.equal(summary.uploadPayload.file_uploads.length, 14)
  assert.match(summary.threadPayload.text, /ios-6/)
  assert.match(summary.threadPayload.text, /android-6/)
  assert.equal(carousel.elements[0].subtitle.text, 'iOS · failed flow')
  assert.equal(carousel.elements[1].subtitle.text, 'Android · failed flow')
})

test('uses a cancellation presentation for partial results', () => {
  const summary = build([
    platform({
      name: 'iOS',
      status: 'cancelled',
      failed: true,
      failures: [],
      phase: 'Building iOS development client',
      hasJUnit: false,
    }),
    platform({
      name: 'Android',
      status: 'cancelled',
      failed: true,
      failures: [],
      phase: 'Building Android development client',
      hasJUnit: false,
    }),
  ])

  assert.equal(summary.state, 'cancelled')
  assert.equal(
    summary.payload.blocks[0].text.text,
    '⏹️ Nightly Maestro E2E cancelled',
  )
  assert.match(summary.payload.text, /cancelled/)
  assert.equal(summary.screenshotCount, 0)
})

test('distinguishes setup failures from failed Maestro flows', () => {
  const summary = build([
    platform({
      name: 'iOS',
      status: 'failure',
      failed: true,
      failures: [],
      phase: 'Starting Metro',
      hasJUnit: false,
    }),
    platform({name: 'Android', status: 'skipped'}),
  ])

  assert.equal(summary.state, 'setup_failed')
  assert.equal(
    summary.payload.blocks[0].text.text,
    '⚠️ Nightly Maestro setup failed',
  )
  assert.equal(
    summary.payload.blocks.some(block => block.type === 'carousel'),
    false,
  )
})

test('extracts file ids from single and multi-file upload responses', () => {
  const response = {
    ok: true,
    files: [
      {
        ok: true,
        files: [{id: 'FONE'}, {id: 'FTWO'}],
      },
    ],
  }

  assert.deepEqual(extractSlackFileIds(response), ['FONE', 'FTWO'])
  assert.deepEqual(
    extractSlackFileIds(JSON.stringify({ok: true, files: [{id: 'FTHREE'}]})),
    ['FTHREE'],
  )
  assert.deepEqual(extractSlackFileIds('not json'), [])
})

test('selects the newest Maestro screenshot for each flow', () => {
  const screenshots = screenshotsByFlow([
    '/tmp/screenshot-❌-300-(composer).png',
    '/tmp/screenshot-❌-100-(composer).png',
    '/tmp/screenshot-❌-200-(login).png',
    '/tmp/artifacts/maestro/composer-self-label/screenshots/step-020-tapOnElement-openMediaBtn.png',
    '/tmp/artifacts/maestro/composer-self-label/screenshots/step-010-launchApp.png',
    '/tmp/not-a-maestro-screenshot.png',
  ])

  assert.equal(
    screenshots.get('composer'),
    '/tmp/screenshot-❌-300-(composer).png',
  )
  assert.equal(screenshots.get('login'), '/tmp/screenshot-❌-200-(login).png')
  assert.equal(
    screenshots.get('composer-self-label'),
    '/tmp/artifacts/maestro/composer-self-label/screenshots/step-020-tapOnElement-openMediaBtn.png',
  )
  assert.equal(screenshots.size, 3)
})
