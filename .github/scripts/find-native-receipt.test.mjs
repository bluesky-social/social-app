import assert from 'node:assert/strict'
import test from 'node:test'

import {
  expectedArtifactName,
  parsePositiveInteger,
  validateTrustedRun,
} from './find-native-receipt.mjs'

test('builds an attempt-scoped artifact name', () => {
  assert.equal(
    expectedArtifactName({
      platform: 'ios',
      buildNumber: '123',
      runId: '45',
      attempt: '2',
    }),
    'native-build-ios-production-123-45-2',
  )
})

test('rejects invalid run identifiers', () => {
  assert.throws(() => parsePositiveInteger('0', 'run-id'), /positive integer/)
  assert.throws(
    () => parsePositiveInteger('1; echo nope', 'run-id'),
    /positive integer/,
  )
})

test('accepts only the expected successful native workflow', () => {
  const expected = {
    repository: 'bluesky-social/social-app',
    workflow: '.github/workflows/build-submit-android.yml',
  }
  const run = {
    conclusion: 'success',
    head_repository: {full_name: expected.repository},
    path: expected.workflow,
    head_sha: 'a'.repeat(40),
  }
  assert.equal(validateTrustedRun(run, expected), run.head_sha)
  assert.throws(
    () =>
      validateTrustedRun(
        {...run, path: '.github/workflows/evil.yml'},
        expected,
      ),
    /untrusted/,
  )
})
