import {describe, expect, test} from '@jest/globals'
import {setupI18n} from '@lingui/core'

import {
  getLinkFailureMessage,
  getUploadFailureMessage,
} from '#/components/ComposerV2/messages'
import {type LinkResolutionFailureCode} from '#/components/ComposerV2/store/linkResolver'
import {type UploadFailureCode} from '#/components/ComposerV2/store/types'

/*
 * Exercised against a real Lingui runtime with an empty catalog, so each
 * `msg` descriptor must compile and fall back to its exact English text.
 */
const i18n = setupI18n({locale: 'en', messages: {en: {}}})

/** Typecheck-enforced exhaustive upload codes, with today's English copy. */
const UPLOAD_COPY = {
  'invalid-image-dimensions': 'The selected image has invalid dimensions.',
  'unreadable-media': 'The selected file could not be read.',
  'unsupported-video-format': 'The selected video uses an unsupported format.',
  'invalid-video-dimensions': 'The selected video has invalid dimensions.',
  'video-too-long': 'The selected video is too long.',
  'video-too-large':
    'The selected video is too large. Please try again with a smaller file.',
  'video-upload-limit':
    'You have temporarily reached the limit for video uploads. Please try again later.',
  'video-rejected': 'The selected video could not be processed.',
  'video-processing-failed': 'The video could not be processed or uploaded.',
  network:
    'An upload failed. Please check your internet connection and try again.',
  'image-failed': 'The image could not be processed or uploaded.',
  'video-failed': 'The video could not be processed or uploaded.',
} satisfies Record<UploadFailureCode, string>

const LINK_COPY = {
  'embedding-disabled': "This post's author has disabled quote posts.",
  unknown: 'The link could not be resolved. Please try again.',
} satisfies Record<LinkResolutionFailureCode, string>

describe('getUploadFailureMessage', () => {
  test.each(Object.entries(UPLOAD_COPY))('%s', (code, expected) => {
    expect(
      getUploadFailureMessage({
        failure: {code: code as UploadFailureCode},
        i18n,
      }),
    ).toBe(expected)
  })

  test('a limit failure shows the server detail when present', () => {
    expect(
      getUploadFailureMessage({
        failure: {code: 'video-upload-limit', detail: 'Come back tomorrow.'},
        i18n,
      }),
    ).toBe('Come back tomorrow.')
  })

  test('detail is ignored for codes that have their own copy', () => {
    expect(
      getUploadFailureMessage({
        failure: {code: 'network', detail: 'private'},
        i18n,
      }),
    ).toBe(UPLOAD_COPY.network)
  })
})

describe('getLinkFailureMessage', () => {
  test.each(Object.entries(LINK_COPY))('%s', (code, expected) => {
    expect(
      getLinkFailureMessage({code: code as LinkResolutionFailureCode, i18n}),
    ).toBe(expected)
  })
})
