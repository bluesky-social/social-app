import {describe, expect, test} from '@jest/globals'
import {setupI18n} from '@lingui/core'

import {getUploadFailureMessage} from '#/components/ComposerV2/messages'

/* A real Lingui runtime with an empty catalog, so the `msg` descriptors resolve. */
const i18n = setupI18n({locale: 'en', messages: {en: {}}})

describe('getUploadFailureMessage', () => {
  test('a limit failure shows the server detail, or its own copy without one', () => {
    const fallback = getUploadFailureMessage({
      failure: {code: 'video-upload-limit'},
      i18n,
    })

    expect(fallback).not.toBe('')
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
    ).toBe(getUploadFailureMessage({failure: {code: 'network'}, i18n}))
  })
})
