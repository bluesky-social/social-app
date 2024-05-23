import ImageResizer from '@bam.tech/react-native-image-resizer'
import RNFetchBlob from 'rn-fetch-blob'

import {
  downloadAndResize,
  DownloadAndResizeOpts,
} from '../../src/lib/media/manip'

describe('downloadAndResize', () => {
  const errorSpy = jest.spyOn(global.console, 'error')

  const mockResizedImage = {
    path: jest.fn().mockReturnValue('file://resized-image.jpg'),
    size: 100,
    width: 50,
    height: 50,
    mime: 'image/jpeg',
  }

  beforeEach(() => {
    const mockedCreateResizedImage =
      ImageResizer.createResizedImage as jest.Mock
    mockedCreateResizedImage.mockResolvedValue(mockResizedImage)
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
    expect(ImageResizer.createResizedImage).toHaveBeenCalledWith(
      'file://downloaded-image.jpg',
      100,
      100,
      'JPEG',
      100,
      undefined,
      undefined,
      undefined,
      {mode: 'cover'},
    )
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

  it('should return undefined for unsupported file type', async () => {
    const mockedFetch = RNFetchBlob.fetch as jest.Mock
    mockedFetch.mockResolvedValueOnce({
      path: jest.fn().mockReturnValue('file://downloaded-image'),
      info: jest.fn().mockReturnValue({status: 200}),
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
    expect(result).toEqual(mockResizedImage)
    expect(RNFetchBlob.config).toHaveBeenCalledWith({
      fileCache: true,
      appendExt: 'jpeg',
    })
    expect(RNFetchBlob.fetch).toHaveBeenCalledWith(
      'GET',
      'https://example.com/image',
    )
    expect(ImageResizer.createResizedImage).toHaveBeenCalledWith(
      'file://downloaded-image',
      100,
      100,
      'JPEG',
      100,
      undefined,
      undefined,
      undefined,
      {mode: 'cover'},
    )
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
})
