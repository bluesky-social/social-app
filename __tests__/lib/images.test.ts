import {createDownloadResumable, deleteAsync} from 'expo-file-system/legacy'
import {manipulateAsync, SaveFormat} from 'expo-image-manipulator'
import {type Mock, vi} from 'vitest'

import {IMAGE_SIZE_CONFIG_2K_1MB} from '../../src/lib/constants'
import {
  downloadAndResize,
  type DownloadAndResizeOpts,
} from '../../src/lib/media/manip'
import {getResizedDimensions} from '../../src/lib/media/util'

vi.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file://cache/',
  EncodingType: {UTF8: 'utf8', Base64: 'base64'},
  StorageAccessFramework: {},
  getInfoAsync: vi.fn().mockResolvedValue({exists: true, size: 100}),
  deleteAsync: vi.fn(),
  moveAsync: vi.fn().mockResolvedValue(undefined),
  makeDirectoryAsync: vi.fn().mockResolvedValue(undefined),
  writeAsStringAsync: vi.fn().mockResolvedValue(undefined),
  createDownloadResumable: vi.fn(),
}))

vi.mock('expo-media-library', () => ({
  usePermissions: vi.fn(() => [true]),
}))

vi.mock('expo-image-manipulator', () => ({
  manipulateAsync: vi.fn().mockResolvedValue({uri: 'file://resized-image'}),
  SaveFormat: {JPEG: 'jpeg', WEBP: 'webp'},
}))

const mockResizedImage = {
  path: 'file://resized-image.jpg',
  size: 100,
  width: 100,
  height: 100,
  mime: 'image/jpeg',
}

describe('downloadAndResize', () => {
  const errorSpy = vi.spyOn(global.console, 'error')

  beforeEach(() => {
    const mockedCreateResizedImage = manipulateAsync as Mock
    mockedCreateResizedImage.mockResolvedValue({
      uri: 'file://resized-image.jpg',
      ...mockResizedImage,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should return resized image for valid URI and options', async () => {
    const mockedFetch = createDownloadResumable as Mock
    mockedFetch.mockReturnValue({
      cancelAsync: vi.fn(),
      downloadAsync: vi
        .fn()
        .mockResolvedValue({uri: 'file://resized-image.jpg'}),
    })

    const opts: DownloadAndResizeOpts = {
      uri: 'https://example.com/image.jpg',
      maxDimension: 2000,
      maxSize: 500000,
      timeout: 10000,
    }

    const result = await downloadAndResize(opts)
    expect(result).toEqual(mockResizedImage)
    expect(createDownloadResumable).toHaveBeenCalledWith(
      opts.uri,
      expect.anything(),
      {
        cache: true,
      },
    )

    // First time it gets called is to get dimensions
    expect(manipulateAsync).toHaveBeenCalledWith(expect.any(String), [], {})
    // The mocked source image is 100x100, below maxDimension, so it is not
    // downsized.
    expect(manipulateAsync).toHaveBeenCalledWith(
      expect.any(String),
      [{resize: {height: 100, width: 100}}],
      {format: SaveFormat.JPEG, compress: 1.0},
    )
    expect(deleteAsync).toHaveBeenCalledWith(expect.any(String), {
      idempotent: true,
    })
  })

  it('should return undefined for invalid URI', async () => {
    const opts: DownloadAndResizeOpts = {
      uri: 'invalid-uri',
      maxDimension: 2000,
      maxSize: 500000,
      timeout: 10000,
    }

    const result = await downloadAndResize(opts)
    expect(errorSpy).toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('should not downsize whenever dimensions are below the max dimensions', () => {
    const initialDimensionsOne = {
      width: 1200,
      height: 1000,
    }
    const resizedDimensionsOne = getResizedDimensions(
      initialDimensionsOne,
      IMAGE_SIZE_CONFIG_2K_1MB.maxDimension,
    )

    const initialDimensionsTwo = {
      width: 1000,
      height: 1200,
    }
    const resizedDimensionsTwo = getResizedDimensions(
      initialDimensionsTwo,
      IMAGE_SIZE_CONFIG_2K_1MB.maxDimension,
    )

    expect(resizedDimensionsOne).toEqual(initialDimensionsOne)
    expect(resizedDimensionsTwo).toEqual(initialDimensionsTwo)
  })

  it('should resize dimensions and maintain aspect ratio if they are above the max dimensons', () => {
    const initialDimensionsOne = {
      width: 3000,
      height: 1500,
    }
    const resizedDimensionsOne = getResizedDimensions(
      initialDimensionsOne,
      IMAGE_SIZE_CONFIG_2K_1MB.maxDimension,
    )

    const initialDimensionsTwo = {
      width: 2000,
      height: 4000,
    }
    const resizedDimensionsTwo = getResizedDimensions(
      initialDimensionsTwo,
      IMAGE_SIZE_CONFIG_2K_1MB.maxDimension,
    )

    expect(resizedDimensionsOne).toEqual({
      width: 2000,
      height: 1000,
    })
    expect(resizedDimensionsTwo).toEqual({
      width: 1000,
      height: 2000,
    })
  })
})
