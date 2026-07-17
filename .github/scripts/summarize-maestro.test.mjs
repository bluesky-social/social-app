import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import {fileURLToPath} from 'node:url'

import {buildSummary, parseJUnit} from './summarize-maestro.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const fixtures = path.join(here, 'fixtures')
const common = {
  artifactUrls: {
    ios: 'https://github.test/run/artifacts/1',
    android: 'https://github.test/run/artifacts/2',
  },
  sha: '0123456789abcdef',
  runUrl: 'https://github.test/run',
  commitUrl: 'https://github.test/commit/0123456789abcdef',
}

test('does not notify for successful jobs and successful JUnit', () => {
  const root = path.join(fixtures, 'success')
  const summary = buildSummary({
    ...common,
    iosStatus: 'success',
    androidStatus: 'success',
    iosRoot: path.join(root, 'ios'),
    androidRoot: path.join(root, 'android'),
  })

  assert.equal(summary.notify, false)
  assert.deepEqual(
    summary.platforms.map(platform => platform.failures),
    [[], []],
  )
})

test('reports failed flow names and concise failure messages', () => {
  const root = path.join(fixtures, 'failed-flow')
  const summary = buildSummary({
    ...common,
    iosStatus: 'success',
    androidStatus: 'failure',
    iosRoot: path.join(fixtures, 'success', 'ios'),
    androidRoot: path.join(root, 'android'),
  })

  assert.equal(summary.notify, true)
  assert.match(summary.payload.text, /create-account\.yml/)
  assert.match(summary.payload.text, /Element not found: Create account/)
  assert.match(summary.payload.text, /Android logs and artifacts/)
})

test('reports the latest setup phase when infrastructure fails before JUnit', () => {
  const root = path.join(fixtures, 'infrastructure-failure')
  const summary = buildSummary({
    ...common,
    iosStatus: 'failure',
    androidStatus: 'success',
    iosRoot: path.join(root, 'ios'),
    androidRoot: path.join(fixtures, 'success', 'android'),
  })

  assert.equal(summary.notify, true)
  assert.match(
    summary.payload.text,
    /Setup phase: Building and installing the development client/,
  )
})

test('parses self-closing JUnit failures', () => {
  const failures = parseJUnit(
    '<testsuite failures="1"><testcase name="flow.yml"><failure message="boom"/></testcase></testsuite>',
  )
  assert.deepEqual(failures, [{name: 'flow.yml', message: 'boom'}])
})
