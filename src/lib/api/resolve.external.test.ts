import {afterEach, beforeEach, expect, jest, test} from '@jest/globals'

import {type LinkResolvers, resolveLink} from '#/lib/api/resolve'
import {type ComposerImage, type ImageMeta} from '#/state/gallery'

const mockPreviewSpan = {setAttribute: jest.fn(), end: jest.fn()}
const mockPhaseSpan = {setAttribute: jest.fn(), end: jest.fn()}
const mockCreateComposerImage =
  jest.fn<(...args: unknown[]) => Promise<ComposerImage>>()
const mockDownloadAndResize =
  jest.fn<(...args: unknown[]) => Promise<ImageMeta | undefined>>()
jest.mock('#/logger/sentry/lib', () => ({
  Sentry: {
    startInactiveSpan: jest.fn(({name}: {name: string}) =>
      name === 'link.preview' ? mockPreviewSpan : mockPhaseSpan,
    ),
    withActiveSpan: jest.fn((_span: unknown, callback: () => unknown) =>
      callback(),
    ),
  },
}))
jest.mock('#/lib/media/manip', () => ({
  downloadAndResize: (...args: unknown[]) => mockDownloadAndResize(...args),
}))
jest.mock('#/state/gallery', () => ({
  createComposerImage: (...args: unknown[]) => mockCreateComposerImage(...args),
}))

const targetUrl = 'https://docs.example/article'
const imageUrl = 'https://images.example/thumbnail.png'
const rawImage: ImageMeta = {
  path: 'resized.jpg',
  width: 640,
  height: 360,
  mime: 'image/jpeg',
}
const thumbnail: ComposerImage = {
  alt: '',
  source: {id: 'image-id', ...rawImage},
}

beforeEach(() => {
  jest.clearAllMocks()
  mockDownloadAndResize.mockResolvedValue(rawImage)
  mockCreateComposerImage.mockResolvedValue(thumbnail)
})

afterEach(() => {
  jest.restoreAllMocks()
})

test('external preview data and spans include thumbnail preparation', async () => {
  jest.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(
      JSON.stringify({
        error: '',
        url: targetUrl,
        title: 'Example title',
        image: imageUrl,
      }),
    ),
  )

  const result = await resolveLink({} as LinkResolvers, targetUrl)

  expect(mockDownloadAndResize).toHaveBeenCalledTimes(1)
  expect(mockCreateComposerImage).toHaveBeenCalledTimes(1)
  expect(result).toMatchObject({
    type: 'external',
    uri: targetUrl,
    title: 'Example title',
    thumb: thumbnail,
  })
  expect(mockDownloadAndResize).toHaveBeenCalledTimes(1)
  expect(mockCreateComposerImage).toHaveBeenCalledTimes(1)
  expect(mockPreviewSpan.setAttribute.mock.calls).toEqual([
    ['metadata.has_image', true],
    ['outcome', 'success'],
  ])
  expect(mockPhaseSpan.end).toHaveBeenCalledTimes(2)
  expect(mockPreviewSpan.end).toHaveBeenCalledTimes(1)
})

test('metadata errors skip thumbnails and still finish the preview span', async () => {
  jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'))
  jest.spyOn(console, 'error').mockImplementation(() => {})

  const result = await resolveLink({} as LinkResolvers, targetUrl)

  expect(result).toMatchObject({type: 'external', uri: targetUrl})
  expect(result.type === 'external' && result.thumb).toBeUndefined()
  expect(mockDownloadAndResize).not.toHaveBeenCalled()
  expect(mockPreviewSpan.setAttribute.mock.calls).toEqual([
    ['metadata.has_image', false],
    ['outcome', 'metadata_error'],
  ])
  expect(mockPhaseSpan.end).toHaveBeenCalledTimes(1)
  expect(mockPreviewSpan.end).toHaveBeenCalledTimes(1)
})
