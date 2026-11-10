import {type ImagePickerAsset} from 'expo-image-picker'
import {compress} from '@bsky.app/video-compressor'

import {VIDEO_MAX_SIZE} from '#/lib/constants'
import {logger} from '#/logger'
import {compressVideo} from '../compress'

jest.mock('@bsky.app/video-compressor', () => ({
  compress: jest.fn(),
  probe: jest.fn(),
}))
jest.mock('#/logger', () => ({logger: {error: jest.fn(), debug: jest.fn()}}))

const mockCompress = jest.mocked(compress)

function createAsset(overrides: Partial<ImagePickerAsset> = {}) {
  return {
    uri: 'file:///video.mov',
    width: 1080,
    height: 1920,
    mimeType: 'video/quicktime',
    fileSize: 50 * 1024 * 1024,
    ...overrides,
  } as ImagePickerAsset
}

describe('compressVideo', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('uploads the original when native compression fails', async () => {
    const error = new Error('The operation could not be completed')
    mockCompress.mockRejectedValue(error)

    await expect(compressVideo(createAsset())).resolves.toEqual({
      uri: 'file:///video.mov',
      size: 50 * 1024 * 1024,
      mimeType: 'video/quicktime',
      passthroughReason: 'compress-error-fallback',
    })
    expect(logger.error).toHaveBeenCalledWith(
      'Error compressing video, uploading original',
      {safeMessage: error},
    )
  })

  it('rethrows when the original is over the upload limit', async () => {
    const error = new Error('The operation could not be completed')
    mockCompress.mockRejectedValue(error)

    await expect(
      compressVideo(createAsset({fileSize: VIDEO_MAX_SIZE + 1})),
    ).rejects.toBe(error)
  })

  it('rethrows when the original format cannot be uploaded', async () => {
    const error = new Error('The operation could not be completed')
    mockCompress.mockRejectedValue(error)

    await expect(
      compressVideo(createAsset({mimeType: 'video/x-matroska'})),
    ).rejects.toBe(error)
  })

  it('rethrows when the file size is unknown', async () => {
    const error = new Error('The operation could not be completed')
    mockCompress.mockRejectedValue(error)

    await expect(
      compressVideo(createAsset({fileSize: undefined})),
    ).rejects.toBe(error)
  })

  it('rethrows when the upload was cancelled', async () => {
    const controller = new AbortController()
    const error = new Error('Aborted')
    mockCompress.mockImplementation(() => {
      controller.abort()
      return Promise.reject(error)
    })

    await expect(
      compressVideo(createAsset(), {signal: controller.signal}),
    ).rejects.toBe(error)
    expect(logger.error).not.toHaveBeenCalled()
  })
})
