import {downloadAndResize, DownloadAndResizeOpts} from '../../src/lib/download'
import ImageResizer from '@bam.tech/react-native-image-resizer'
import RNFetchBlob from 'rn-fetch-blob'

jest.mock('rn-fetch-blob', () => ({
  config: jest.fn().mockReturnThis(),
  cancel: jest.fn(),
  fetch: jest.fn(),
}))
jest.mock('@bam.tech/react-native-image-resizer', () => ({
  createResizedImage: jest.fn(),
}))

describe('downloadAndResize', () => {
  const errorSpy = jest.spyOn(global.console, 'error')

  const mockResizedImage = {
    path: jest.fn().mockReturnValue('file://resized-image.jpg'),
  }

  beforeEach(() => {
    jest.clearAllMocks()

    const mockedCreateResizedImage =
      ImageResizer.createResizedImage as jest.Mock
    mockedCreateResizedImage.mockResolvedValue(mockResizedImage)
  })

  it('should return resized image for valid URI and options', async () => {
    const mockedFetch = RNFetchBlob.fetch as jest.Mock
    mockedFetch.mockResolvedValueOnce({
      path: jest.fn().mockReturnValue('file://downloaded-image.jpg'),
      flush: jest.fn(),
    })

    const opts: DownloadAndResizeOpts = {
      uri: 'https://example.com/image.jpg',
      width: 100,
      height: 100,
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
      0.7,
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
      mode: 'cover',
      timeout: 10000,
    }

    const result = await downloadAndResize(opts)
    expect(errorSpy).toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('should return undefined for unsupported file type', async () => {
    const opts: DownloadAndResizeOpts = {
      uri: 'https://example.com/image.bmp',
      width: 100,
      height: 100,
      mode: 'cover',
      timeout: 10000,
    }

    const result = await downloadAndResize(opts)
    expect(result).toBeUndefined()
  })
})
