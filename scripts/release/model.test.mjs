import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ReleaseModelError,
  appendOtaChangelog,
  createReleaseDocument,
  deriveReleaseIdentity,
  extractPublicChangelog,
  finalizeReleaseDocument,
  parseReleaseDocument,
} from './model.mjs'

const SHA = '0123456789abcdef0123456789abcdef01234567'

test('derives every release identifier from one version', () => {
  assert.deepEqual(deriveReleaseIdentity('1.131.1'), {
    version: '1.131.1',
    branch: 'release-1.131.1',
    tag: '1.131.1',
    filename: 'RELEASE-1.131.1.md',
    githubReleaseName: 'Release 1.131.1',
  })
})

test('rejects non-strict release versions', () => {
  for (const version of [
    'v1.131.1',
    '1.131',
    '1.131.1-beta',
    ' 1.131.1',
    '1.0131.1',
  ]) {
    assert.throws(() => deriveReleaseIdentity(version), ReleaseModelError)
  }
})

test('creates and parses a prepared release document', () => {
  const document = createReleaseDocument('1.131.1', '- Added something')
  const parsed = parseReleaseDocument(document, {
    filename: 'RELEASE-1.131.1.md',
  })

  assert.deepEqual(parsed.metadata, {releaseVersion: '1.131.1'})
  assert.equal(parsed.sections.length, 1)
  assert.equal(parsed.sections[0].type, 'initial')
  assert.equal(
    extractPublicChangelog(document),
    '## Initial release\n\n- Added something',
  )
})

test('finalizes a release using artifact-derived metadata', () => {
  const prepared = createReleaseDocument('1.131.1', '- Added something')
  const finalized = finalizeReleaseDocument(prepared, {
    sourceTag: '1.131.1',
    sourceSha: SHA,
    iosBuildNumber: 1662,
    androidVersionCode: 1110,
  })
  const parsed = parseReleaseDocument(finalized, {stage: 'final'})

  assert.equal(parsed.metadata.sourceSha, SHA)
  assert.equal(parsed.metadata.iosBuildNumber, '1662')
  assert.equal(parsed.metadata.androidVersionCode, '1110')
})

test('requires all operational metadata in the final state', () => {
  const prepared = createReleaseDocument('1.131.1', '- Added something')
  assert.throws(
    () => parseReleaseDocument(prepared, {stage: 'final'}),
    /missing 'sourceTag'/,
  )
})

test('appends contiguous OTA changelog sections', () => {
  let document = createReleaseDocument('1.131.1', '- Initial change')
  document = appendOtaChangelog(document, 1, '- First fix')
  document = appendOtaChangelog(document, 2, '- Second fix')

  const parsed = parseReleaseDocument(document)
  assert.deepEqual(
    parsed.sections.map(section => section.sequence),
    [null, 1, 2],
  )
  assert.match(parsed.publicChangelog, /## OTA 2\n\n- Second fix$/)
})

test('rejects skipped OTA sequence numbers', () => {
  const document = createReleaseDocument('1.131.1', '- Initial change')
  assert.throws(() => appendOtaChangelog(document, 2, '- A fix'), /must be 1/)
})

test('rejects filename, metadata, and changelog inconsistencies', () => {
  const document = createReleaseDocument('1.131.1', '- Initial change')
  assert.throws(
    () => parseReleaseDocument(document, {filename: 'RELEASE-1.132.0.md'}),
    /Filename must be/,
  )
  assert.throws(
    () =>
      parseReleaseDocument(document.replace('releaseVersion:', 'surprise:')),
    /Unknown release frontmatter field/,
  )
  assert.throws(
    () => parseReleaseDocument(document.replace('Initial release', 'OTA 1')),
    /must begin with an '## Initial release'/,
  )
  assert.throws(
    () =>
      parseReleaseDocument(
        document.replace(
          '- Initial change',
          '- Initial change\n\n## Notes\n\nNope',
        ),
      ),
    /Unsupported public changelog section/,
  )
})
