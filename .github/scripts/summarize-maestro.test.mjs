import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import {buildSummary} from './summarize-maestro.mjs'

test('includes up to five matching failure screenshots and prefers the latest', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'maestro-summary-'))
  t.after(() => fs.rmSync(root, {recursive: true}))

  const failures = Array.from({length: 7}, (_, index) => `flow-${index + 1}`)
  fs.writeFileSync(
    path.join(root, 'report.xml'),
    `<testsuite>${failures
      .map(
        name =>
          `<testcase name="${name}"><failure>Failed ${name}</failure></testcase>`,
      )
      .join('')}</testsuite>`,
  )
  for (const [index, name] of failures.entries()) {
    if (name === 'flow-2') continue
    fs.writeFileSync(
      path.join(root, `screenshot-❌-${index + 1}-(${name}).png`),
      '',
    )
  }
  fs.writeFileSync(path.join(root, 'screenshot-❌-7-(unrelated).png'), '')
  fs.writeFileSync(path.join(root, 'screenshot-❌-8-(flow-1).png'), '')

  const summary = buildSummary({
    iosStatus: 'failure',
    androidStatus: 'skipped',
    iosRoot: root,
    sha: '0123456789abcdef',
    runUrl: 'https://example.com/run',
    commitUrl: 'https://example.com/commit',
  })

  assert.deepEqual(
    summary.screenshotUploads.map(upload => upload.filename),
    ['flow-1', 'flow-3', 'flow-4', 'flow-5', 'flow-6'].map(
      name => `ios-${name}.png`,
    ),
  )
  assert.equal(
    summary.screenshotUploads[0].file,
    path.relative(
      process.cwd(),
      path.join(root, 'screenshot-❌-8-(flow-1).png'),
    ),
  )
})

test('does not create screenshot uploads for setup failures', () => {
  const summary = buildSummary({
    iosStatus: 'failure',
    androidStatus: 'skipped',
    sha: '0123456789abcdef',
    runUrl: 'https://example.com/run',
    commitUrl: 'https://example.com/commit',
  })

  assert.deepEqual(summary.screenshotUploads, [])
})
