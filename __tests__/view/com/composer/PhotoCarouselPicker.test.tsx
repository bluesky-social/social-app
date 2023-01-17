import React from 'react'
import {PhotoCarouselPicker} from '../../../../src/view/com/composer/PhotoCarouselPicker'
import {cleanup, fireEvent, render} from '../../../../jest/test-utils'
import {
  openCamera,
  openCropper,
  openPicker,
} from 'react-native-image-crop-picker'

describe('PhotoCarouselPicker', () => {
  const mockedProps = {
    selectedPhotos: ['mock-uri', 'mock-uri-2'],
    onSelectPhotos: jest.fn(),
    localPhotos: {
      photos: [
        {
          node: {
            image: {
              uri: 'mock-uri',
            },
          },
        },
      ],
    },
  }

  afterAll(() => {
    jest.clearAllMocks()
    cleanup()
  })

  it('renders carousel picker', async () => {
    const {findByTestId} = render(<PhotoCarouselPicker {...mockedProps} />)
    const photoCarouselPickerView = await findByTestId(
      'photoCarouselPickerView',
    )
    expect(photoCarouselPickerView).toBeTruthy()
  })

  it('triggers openCamera', async () => {
    const {findByTestId} = render(<PhotoCarouselPicker {...mockedProps} />)
    const openCameraButton = await findByTestId('openCameraButton')
    fireEvent.press(openCameraButton)

    expect(openCamera).toHaveBeenCalledWith({
      compressImageQuality: 1,
      cropping: true,
      forceJpg: true,
      freeStyleCropEnabled: true,
      height: 1000,
      mediaType: 'photo',
      width: 1000,
    })
  })

  it('triggers openCropper', async () => {
    const {findByTestId} = render(<PhotoCarouselPicker {...mockedProps} />)
    const openSelectPhotoButton = await findByTestId('openSelectPhotoButton')
    fireEvent.press(openSelectPhotoButton)

    expect(openCropper).toHaveBeenCalledWith({
      compressImageQuality: 1,
      forceJpg: true,
      freeStyleCropEnabled: true,
      height: 1000,
      mediaType: 'photo',
      path: 'mock-uri',
      width: 1000,
    })
  })

  it('triggers openPicker', async () => {
    const {findByTestId} = render(<PhotoCarouselPicker {...mockedProps} />)
    const openGalleryButton = await findByTestId('openGalleryButton')
    fireEvent.press(openGalleryButton)

    expect(openPicker).toHaveBeenCalledWith({
      maxFiles: 2,
      mediaType: 'photo',
      multiple: true,
    })
    expect(openCropper).toHaveBeenCalledWith({
      compressImageQuality: 1,
      forceJpg: true,
      freeStyleCropEnabled: true,
      height: 1000,
      mediaType: 'photo',
      path: 'mock-uri',
      width: 1000,
    })
  })
})
