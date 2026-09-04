import {File, Paths} from 'expo-file-system'
import {ImageManipulator, SaveFormat} from 'expo-image-manipulator'

import {IMAGE_SIZE_CONFIG_2K_1MB} from '../../src/lib/constants'
import {
  downloadAndResize,
  type DownloadAndResizeOpts,
} from '../../src/lib/media/manip'
import {getResizedDimensions} from '../../src/lib/media/util'

const mockResizedImage = {
  size: 100,
  width: 100,
  height: 100,
  mime: 'image/jpeg',
}

describe('downloadAndResize', () => {
  const errorSpy = jest.spyOn(global.console, 'error')

  beforeEach(() => {
    const mockedDownload = File.downloadFileAsync as jest.Mock
    mockedDownload.mockResolvedValue(new File('file://downloaded-image.jpg'))

    let savedImageCount = 0
    const mockedManipulate = ImageManipulator.manipulate as jest.Mock
    mockedManipulate.mockImplementation(() => {
      const image = {
        ...mockResizedImage,
        release: jest.fn(),
        uri: 'file://rendered-image.jpg',
        saveAsync: jest.fn().mockImplementation(() => {
          savedImageCount += 1
          return Promise.resolve({
            uri: `file://resized-image-${savedImageCount}.jpg`,
            ...mockResizedImage,
          })
        }),
      }
      return {
        release: jest.fn(),
        renderAsync: jest.fn().mockResolvedValue(image),
        resize: jest.fn(),
      }
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return resized image for valid URI and options', async () => {
    const opts: DownloadAndResizeOpts = {
      uri: 'https://example.com/image.jpg',
      maxDimension: 2000,
      maxSize: 500000,
      timeout: 10000,
    }

    const result = await downloadAndResize(opts)
    expect(result).toEqual({
      ...mockResizedImage,
      path: 'file://resized-image-7.jpg',
    })
    expect(File.downloadFileAsync).toHaveBeenCalledWith(
      opts.uri,
      expect.anything(),
      {
        idempotent: true,
        signal: expect.any(AbortSignal),
      },
    )

    // First time it gets called is to get dimensions.
    expect(ImageManipulator.manipulate).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
    )
    const firstContext = (ImageManipulator.manipulate as jest.Mock).mock
      .results[0].value
    expect(firstContext.resize).not.toHaveBeenCalled()

    // The mocked source image is 100x100, below maxDimension, so it is not
    // downsized.
    const secondContext = (ImageManipulator.manipulate as jest.Mock).mock
      .results[1].value
    expect(secondContext.resize).toHaveBeenCalledWith({
      height: 100,
      width: 100,
    })
    const lastContext = (
      ImageManipulator.manipulate as jest.Mock
    ).mock.results.at(-1)!.value
    const resizedImage = await lastContext.renderAsync.mock.results[0].value
    expect(resizedImage.saveAsync).toHaveBeenCalledWith(
      expect.objectContaining({format: SaveFormat.JPEG, compress: 1.0}),
    )
    const deletedPaths = (Paths.info as jest.Mock).mock.calls.map(
      ([path]) => path,
    )
    expect(deletedPaths).toEqual(
      expect.arrayContaining([
        'file://resized-image-1.jpg',
        'file://resized-image-2.jpg',
        'file://resized-image-3.jpg',
        'file://resized-image-4.jpg',
        'file://resized-image-5.jpg',
        'file://resized-image-6.jpg',
      ]),
    )
    expect(deletedPaths).not.toContain('file://resized-image-7.jpg')
  })

  it('deletes a partial download when downloading fails', async () => {
    const mockedDownload = File.downloadFileAsync as jest.Mock
    mockedDownload.mockRejectedValue(new Error('download failed'))

    const opts: DownloadAndResizeOpts = {
      uri: 'https://example.com/image.jpg',
      maxDimension: 2000,
      maxSize: 500000,
      timeout: 10000,
    }

    await expect(downloadAndResize(opts)).rejects.toThrow('download failed')
    expect(Paths.info).toHaveBeenCalledWith(expect.stringMatching(/-download$/))
  })

  it('deletes every intermediate image when resizing fails', async () => {
    const mockedManipulate = ImageManipulator.manipulate as jest.Mock
    const createContext = mockedManipulate.getMockImplementation()!
    mockedManipulate.mockImplementation((...args) => {
      const context = createContext(...args)
      if (mockedManipulate.mock.calls.length === 3) {
        context.renderAsync.mockRejectedValue(new Error('render failed'))
      }
      return context
    })

    const opts: DownloadAndResizeOpts = {
      uri: 'https://example.com/image.jpg',
      maxDimension: 2000,
      maxSize: 500000,
      timeout: 10000,
    }

    await expect(downloadAndResize(opts)).rejects.toThrow('render failed')
    const deletedPaths = (Paths.info as jest.Mock).mock.calls.map(
      ([path]) => path,
    )
    expect(deletedPaths).toEqual(
      expect.arrayContaining([
        'file://resized-image-1.jpg',
        'file://resized-image-2.jpg',
      ]),
    )
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
