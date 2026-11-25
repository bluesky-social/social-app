import {afterEach, beforeEach, expect, jest, test} from '@jest/globals'

import {type LinkResolvers, resolveLink} from '#/lib/api/resolve'
import {type ComposerImage, type ImageMeta} from '#/state/gallery'

const mockPreviewSpan = {setAttribute: jest.fn(), end: jest.fn()}
const mockMetadataSpan = {setAttribute: jest.fn(), end: jest.fn()}
const mockThumbnailSpan = {setAttribute: jest.fn(), end: jest.fn()}
const mockCreateComposerImage =
  jest.fn<(...args: unknown[]) => Promise<ComposerImage>>()
const mockDownloadAndResize =
  jest.fn<(...args: unknown[]) => Promise<ImageMeta | undefined>>()
jest.mock('#/logger/sentry/lib', () => ({
  Sentry: {
    startInactiveSpan: jest.fn(({name}: {name: string}) => {
      switch (name) {
        case 'link.preview':
          return mockPreviewSpan
        case 'link.preview.metadata':
          return mockMetadataSpan
        case 'link.preview.thumbnail':
          return mockThumbnailSpan
        default:
          throw new Error(`Unexpected span: ${name}`)
      }
    }),
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

const {Sentry}: {Sentry: typeof import('#/logger/sentry/lib').Sentry} =
  jest.requireMock('#/logger/sentry/lib')

const targetUrl = 'https://docs.example/article'
const imageUrl = 'https://images.example/thumbnail.png'
const metadata = {
  error: '',
  url: targetUrl,
  title: 'Example title',
  description: 'Example description',
  image: imageUrl,
  author: 'at://did:plc:author',
}
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
  jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(JSON.stringify(metadata)))
  mockDownloadAndResize.mockResolvedValue(rawImage)
  mockCreateComposerImage.mockResolvedValue(thumbnail)
})

afterEach(() => {
  jest.restoreAllMocks()
})

test('external preview data and spans include thumbnail preparation', async () => {
  let finishThumbnail!: (value: ComposerImage) => void
  const thumbnailReady = new Promise<ComposerImage>(resolve => {
    finishThumbnail = resolve
  })
  const thumbnailStarted = new Promise<void>(resolve => {
    mockCreateComposerImage.mockImplementationOnce(() => {
      resolve()
      return thumbnailReady
    })
  })

  const resolution = resolveLink({} as LinkResolvers, targetUrl)
  await thumbnailStarted

  expect(mockMetadataSpan.end).toHaveBeenCalledTimes(1)
  expect(mockThumbnailSpan.end).not.toHaveBeenCalled()
  expect(mockPreviewSpan.end).not.toHaveBeenCalled()

  finishThumbnail(thumbnail)
  const result = await resolution

  expect(mockDownloadAndResize).toHaveBeenCalledTimes(1)
  expect(mockCreateComposerImage).toHaveBeenCalledTimes(1)
  expect(result).toMatchObject({
    type: 'external',
    uri: targetUrl,
    title: metadata.title,
    description: metadata.description,
    authorDid: 'did:plc:author',
    thumb: thumbnail,
  })
  expect(mockPreviewSpan.setAttribute.mock.calls).toEqual([
    ['metadata.has_image', true],
    ['outcome', 'success'],
  ])
  expect(mockMetadataSpan.end).toHaveBeenCalledTimes(1)
  expect(mockThumbnailSpan.end).toHaveBeenCalledTimes(1)
  expect(mockPreviewSpan.end).toHaveBeenCalledTimes(1)
})

test('external metadata without an image still records a real preview attempt', async () => {
  jest
    .mocked(fetch)
    .mockResolvedValue(new Response(JSON.stringify({...metadata, image: ''})))

  const result = await resolveLink({} as LinkResolvers, targetUrl)

  expect(fetch).toHaveBeenCalledTimes(1)
  expect(result).toMatchObject({
    type: 'external',
    uri: targetUrl,
    title: metadata.title,
    description: metadata.description,
    thumb: undefined,
  })
  expect(mockDownloadAndResize).not.toHaveBeenCalled()
  expect(Sentry.startInactiveSpan).toHaveBeenCalledTimes(2)
  expect(mockPreviewSpan.setAttribute.mock.calls).toEqual([
    ['metadata.has_image', false],
    ['outcome', 'no_image'],
  ])
  expect(mockMetadataSpan.end).toHaveBeenCalledTimes(1)
  expect(mockThumbnailSpan.end).not.toHaveBeenCalled()
  expect(mockPreviewSpan.end).toHaveBeenCalledTimes(1)
})

test.each(['network', 'metadata response'])(
  '%s errors skip thumbnails and still finish the preview span',
  async failure => {
    if (failure === 'network') {
      jest.mocked(fetch).mockRejectedValue(new Error('offline'))
    } else {
      jest
        .mocked(fetch)
        .mockResolvedValue(new Response(JSON.stringify({error: 'Not found'})))
    }
    jest.spyOn(console, 'error').mockImplementation(() => {})

    const result = await resolveLink({} as LinkResolvers, targetUrl)

    expect(result).toMatchObject({
      type: 'external',
      uri: targetUrl,
      title: '',
      description: '',
      thumb: undefined,
    })
    expect(mockDownloadAndResize).not.toHaveBeenCalled()
    expect(Sentry.startInactiveSpan).toHaveBeenCalledTimes(2)
    expect(mockPreviewSpan.setAttribute.mock.calls).toEqual([
      ['metadata.has_image', false],
      ['outcome', 'metadata_error'],
    ])
    expect(mockMetadataSpan.end).toHaveBeenCalledTimes(1)
    expect(mockThumbnailSpan.end).not.toHaveBeenCalled()
    expect(mockPreviewSpan.end).toHaveBeenCalledTimes(1)
  },
)

test.each(['download', 'empty download', 'processing'])(
  'thumbnail %s failures preserve metadata and finish both phases',
  async failure => {
    if (failure === 'download') {
      mockDownloadAndResize.mockRejectedValue(new Error('offline'))
    } else if (failure === 'empty download') {
      mockDownloadAndResize.mockResolvedValue(undefined)
    } else {
      mockCreateComposerImage.mockRejectedValue(new Error('processing failed'))
    }

    const result = await resolveLink({} as LinkResolvers, targetUrl)

    expect(result).toMatchObject({
      type: 'external',
      uri: targetUrl,
      title: metadata.title,
      description: metadata.description,
      thumb: undefined,
    })
    expect(mockCreateComposerImage).toHaveBeenCalledTimes(
      failure === 'processing' ? 1 : 0,
    )
    expect(mockPreviewSpan.setAttribute.mock.calls).toEqual([
      ['metadata.has_image', true],
      ['outcome', 'thumbnail_error'],
    ])
    expect(mockMetadataSpan.end).toHaveBeenCalledTimes(1)
    expect(mockThumbnailSpan.end).toHaveBeenCalledTimes(1)
    expect(mockPreviewSpan.end).toHaveBeenCalledTimes(1)
  },
)

test.each([
  'https://images.example/photo.jpg',
  'https://bsky.app/profile/example.test',
  'not a URL',
])('skipped metadata for %s creates no preview spans', async uri => {
  const result = await resolveLink({} as LinkResolvers, uri)

  expect(result).toMatchObject({
    type: 'external',
    uri,
    title: '',
    description: '',
    thumb: undefined,
  })
  expect(fetch).not.toHaveBeenCalled()
  expect(mockDownloadAndResize).not.toHaveBeenCalled()
  expect(Sentry.startInactiveSpan).not.toHaveBeenCalled()
})

test.each([
  'https://bsky.app',
  'http://bsky.app/profile/example.test',
  'https://BSKY.APP/profile/example.test',
  'https://www.bsky.app/profile/example.test',
])('internal metadata requests for %s create no preview spans', async uri => {
  const result = await resolveLink({} as LinkResolvers, uri)

  expect(fetch).toHaveBeenCalledTimes(1)
  expect(result).toMatchObject({
    type: 'external',
    uri,
    title: metadata.title,
    thumb: thumbnail,
  })
  expect(Sentry.startInactiveSpan).not.toHaveBeenCalled()
})
