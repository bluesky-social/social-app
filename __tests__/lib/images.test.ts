import {deleteAsync} from 'expo-file-system'
import {manipulateAsync, SaveFormat} from 'expo-image-manipulator'
import RNFetchBlob from 'rn-fetch-blob'

import {
  downloadAndResize,
  DownloadAndResizeOpts,
  getResizedDimensions,
} from '../../src/lib/media/manip'

const mockResizedImage = {
  path: 'file://resized-image.jpg',
  size: 100,
  width: 100,
  height: 100,
  mime: 'image/jpeg',
}

describe('downloadAndResize', () => {
  const errorSpy = jest.spyOn(global.console, 'error')

  beforeEach(() => {
    const mockedCreateResizedImage = manipulateAsync as jest.Mock
    mockedCreateResizedImage.mockResolvedValue({
      uri: 'file://resized-image.jpg',
      ...mockResizedImage,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return resized image for valid URI and options', async () => {
    const mockedFetch = RNFetchBlob.fetch as jest.Mock
    mockedFetch.mockResolvedValueOnce({
      path: jest.fn().mockReturnValue('file://downloaded-image.jpg'),
      info: jest.fn().mockReturnValue({status: 200}),
      flush: jest.fn(),
    })

    const opts: DownloadAndResizeOpts = {
      uri: 'https://example.com/image.jpg',
      width: 100,
      height: 100,
      maxSize: 500000,
      mode: 'cover',
      timeout: 10000,
    }

    const result = await downloadAndResize(opts)
    expect(result).toEqual(mockResizedImage)
    expect(RNFetchBlob.config).toHaveBeenCalledWith({
      fileCache: true,
      appendExt: 'jpeg',
    })
    expect(RNFetchBlob.fetch).toHaveBeenCalledWith(
      'GET',
      'https://example.com/image.jpg',
    )

    // First time it gets called is to get dimensions
    expect(manipulateAsync).toHaveBeenCalledWith(expect.any(String), [], {})
    expect(manipulateAsync).toHaveBeenCalledWith(
      expect.any(String),
      [{resize: {height: opts.height, width: opts.width}}],
      {format: SaveFormat.JPEG, compress: 1.0},
    )
    expect(deleteAsync).toHaveBeenCalledWith(expect.any(String), {
      idempotent: true,
    })
  })

  it('should return undefined for invalid URI', async () => {
    const opts: DownloadAndResizeOpts = {
      uri: 'invalid-uri',
      width: 100,
      height: 100,
      maxSize: 500000,
      mode: 'cover',
      timeout: 10000,
    }

    const result = await downloadAndResize(opts)
    expect(errorSpy).toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('should return undefined for non-200 response', async () => {
    const mockedFetch = RNFetchBlob.fetch as jest.Mock
    mockedFetch.mockResolvedValueOnce({
      path: jest.fn().mockReturnValue('file://downloaded-image'),
      info: jest.fn().mockReturnValue({status: 400}),
      flush: jest.fn(),
    })

    const opts: DownloadAndResizeOpts = {
      uri: 'https://example.com/image',
      width: 100,
      height: 100,
      maxSize: 500000,
      mode: 'cover',
      timeout: 10000,
    }

    const result = await downloadAndResize(opts)
    expect(errorSpy).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('should not downsize whenever dimensions are below the max dimensions', () => {
    const initialDimensionsOne = {
      width: 1200,
      height: 1000,
    }
    const resizedDimensionsOne = getResizedDimensions(initialDimensionsOne)

    const initialDimensionsTwo = {
      width: 1000,
      height: 1200,
    }
    const resizedDimensionsTwo = getResizedDimensions(initialDimensionsTwo)

    expect(resizedDimensionsOne).toEqual(initialDimensionsOne)
    expect(resizedDimensionsTwo).toEqual(initialDimensionsTwo)
  })

  it('should resize dimensions and maintain aspect ratio if they are above the max dimensons', () => {
    const initialDimensionsOne = {
      width: 3000,
      height: 1500,
    }
    const resizedDimensionsOne = getResizedDimensions(initialDimensionsOne)

    const initialDimensionsTwo = {
      width: 2000,
      height: 4000,
    }
    const resizedDimensionsTwo = getResizedDimensions(initialDimensionsTwo)

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
