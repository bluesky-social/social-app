import {type ImagePickerAsset} from 'expo-image-picker'
import {afterEach, describe, expect, jest, test} from '@jest/globals'

const mockSharedGetVideoMetadata =
  jest.fn<
    (
      file: File | string,
      fallbackMimeType?: string,
    ) => Promise<ImagePickerAsset>
  >()
jest.mock('#/view/com/composer/videos/metadata', () => ({
  getVideoMetadata: (...args: [File | string, string?]) =>
    mockSharedGetVideoMetadata(...args),
}))
const mockSafeDeleteAsync = jest.fn()
jest.mock('#/lib/media/manip', () => ({
  getImageDim: jest.fn(),
  safeDeleteAsync: (...args: unknown[]) => mockSafeDeleteAsync(...args),
}))

import {videoUploadDependencies} from '#/components/ComposerV2/store/uploadDependencies'
import {createScalarVideoMetadata} from '#/components/ComposerV2/store/utils/createScalarVideoMetadata'
import {
  releaseCompressedImage,
  releaseCompressedVideo,
} from '#/components/ComposerV2/store/utils/mediaRelease'
import {
  releaseCompressedImage as releaseCompressedImageWeb,
  releaseCompressedVideo as releaseCompressedVideoWeb,
  releaseVideoProbeUri as releaseVideoProbeUriWeb,
} from '#/components/ComposerV2/store/utils/mediaRelease.web'

const probed: ImagePickerAsset = {
  uri: 'blob:helper-created',
  file: new File(['x'], 'v.mp4'),
  width: 1920,
  height: 1080,
  mimeType: 'video/mp4',
  duration: 4000,
  fileSize: 99,
}

const revokeObjectURL = jest.fn()
Object.assign(URL, {revokeObjectURL})

afterEach(() => {
  jest.clearAllMocks()
})

describe('createScalarVideoMetadata', () => {
  test('returns only scalars and releases the probe URI once', async () => {
    const releaseProbeUri = jest.fn()
    const getMetadata = createScalarVideoMetadata({
      getVideoMetadata: () => Promise.resolve(probed),
      releaseProbeUri,
    })

    const result = await getMetadata(probed.file!, 'video/mp4')

    expect(result).toEqual({
      width: 1920,
      height: 1080,
      mimeType: 'video/mp4',
      duration: 4000,
      fileSize: 99,
    })
    expect(releaseProbeUri).toHaveBeenCalledTimes(1)
    expect(releaseProbeUri).toHaveBeenCalledWith({uri: 'blob:helper-created'})
  })

  test('a failing release does not change the metadata result', async () => {
    const getMetadata = createScalarVideoMetadata({
      getVideoMetadata: () => Promise.resolve(probed),
      releaseProbeUri: () => {
        throw new Error('revoke failed')
      },
    })

    await expect(getMetadata(probed.file!)).resolves.toMatchObject({
      width: 1920,
    })
  })

  test('a rejected probe stays the failure and releases nothing', async () => {
    const releaseProbeUri = jest.fn()
    const failure = new Error('probe failed')
    const getMetadata = createScalarVideoMetadata({
      getVideoMetadata: () => Promise.reject(failure),
      releaseProbeUri,
    })

    await expect(getMetadata(probed.file!)).rejects.toBe(failure)
    expect(releaseProbeUri).not.toHaveBeenCalled()
  })
})

describe('production video metadata adapter', () => {
  test('native: reads scalars from the shared helper and revokes nothing', async () => {
    mockSharedGetVideoMetadata.mockResolvedValue({
      ...probed,
      uri: 'file:///source.mp4',
    })

    const result = await videoUploadDependencies.getVideoMetadata(
      'file:///source.mp4',
      'video/mp4',
    )

    expect(mockSharedGetVideoMetadata).toHaveBeenCalledWith(
      'file:///source.mp4',
      'video/mp4',
    )
    expect(result).toEqual({
      width: 1920,
      height: 1080,
      mimeType: 'video/mp4',
      duration: 4000,
      fileSize: 99,
    })
    expect(result).not.toHaveProperty('uri')
    expect(result).not.toHaveProperty('file')
    expect(revokeObjectURL).not.toHaveBeenCalled()
  })

  test('web: revokes the helper-created URI and nothing else', async () => {
    const getMetadata = createScalarVideoMetadata({
      getVideoMetadata: () => Promise.resolve(probed),
      releaseProbeUri: releaseVideoProbeUriWeb,
    })

    await getMetadata(probed.file!)

    expect(revokeObjectURL).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:helper-created')
  })

  test('web: a throwing revoke leaves the metadata result intact', async () => {
    revokeObjectURL.mockImplementationOnce(() => {
      throw new Error('revoke failed')
    })
    const getMetadata = createScalarVideoMetadata({
      getVideoMetadata: () => Promise.resolve(probed),
      releaseProbeUri: releaseVideoProbeUriWeb,
    })

    await expect(getMetadata(probed.file!)).resolves.toMatchObject({
      duration: 4000,
    })
  })
})

describe('platform output release', () => {
  test('native deletes the file; web images revoke; web video is a no-op', () => {
    void releaseCompressedImage({uri: 'file:///out.jpg'})
    void releaseCompressedVideo({uri: 'file:///out.mp4'})
    expect(mockSafeDeleteAsync.mock.calls).toEqual([
      ['file:///out.jpg'],
      ['file:///out.mp4'],
    ])
    expect(revokeObjectURL).not.toHaveBeenCalled()

    releaseCompressedImageWeb({uri: 'blob:out'})
    releaseCompressedVideoWeb({uri: 'blob:source'})
    expect(revokeObjectURL.mock.calls).toEqual([['blob:out']])
    expect(mockSafeDeleteAsync).toHaveBeenCalledTimes(2)
  })
})
