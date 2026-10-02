import {afterEach, describe, expect, jest, test} from '@jest/globals'

let mockIsWeb = false
jest.mock('#/env', () =>
  /* A getter keeps IS_WEB live; object spread would copy its current value. */
  Object.defineProperty({...jest.requireActual<object>('#/env')}, 'IS_WEB', {
    get: () => mockIsWeb,
  }),
)

import {pastedMediaToInput} from '#/components/ComposerV2/adapters/pastedMedia'

afterEach(() => {
  mockIsWeb = false
})

describe('pastedMediaToInput', () => {
  describe('native text-input payloads', () => {
    test('a pasted file URI is an image whose metadata the worker resolves', () => {
      expect(pastedMediaToInput({source: 'file:///tmp/paste.png'})).toEqual({
        kind: 'image',
        uri: 'file:///tmp/paste.png',
      })
    })

    test('a data URI image keeps its type, and a GIF stays a still image', () => {
      expect(
        pastedMediaToInput({source: 'data:image/webp;base64,AAAA'}),
      ).toEqual({
        kind: 'image',
        uri: 'data:image/webp;base64,AAAA',
        mimeType: 'image/webp',
      })
      expect(
        pastedMediaToInput({source: 'data:image/gif;base64,AAAA'}),
      ).toMatchObject({kind: 'image', mimeType: 'image/gif'})
    })

    test('a data URI video is rejected', () => {
      expect(
        pastedMediaToInput({source: 'data:video/mp4;base64,AAAA'}),
      ).toBeUndefined()
    })
  })

  describe('web paste and drop payloads', () => {
    test('data URIs are classified by type, with GIF files using the video pipeline', () => {
      mockIsWeb = true
      expect(
        pastedMediaToInput({source: 'data:image/png;base64,AAAA'}),
      ).toEqual({
        kind: 'image',
        uri: 'data:image/png;base64,AAAA',
        mimeType: 'image/png',
      })
      expect(
        pastedMediaToInput({source: 'data:image/gif;base64,AAAA'}),
      ).toEqual({
        kind: 'video',
        uri: 'data:image/gif;base64,AAAA',
        mimeType: 'image/gif',
      })
      expect(
        pastedMediaToInput({source: 'data:video/webm;base64,AAAA'}),
      ).toEqual({
        kind: 'video',
        uri: 'data:video/webm;base64,AAAA',
        mimeType: 'video/webm',
      })
    })

    test('an untyped object URL is treated as an image', () => {
      mockIsWeb = true
      expect(pastedMediaToInput({source: 'blob:https://bsky.app/x'})).toEqual({
        kind: 'image',
        uri: 'blob:https://bsky.app/x',
      })
    })

    test('unsupported content is rejected', () => {
      mockIsWeb = true
      expect(
        pastedMediaToInput({source: 'data:application/pdf;base64,AAAA'}),
      ).toBeUndefined()
      expect(
        pastedMediaToInput({source: 'data:text/plain;base64,AAAA'}),
      ).toBeUndefined()
    })
  })
})
