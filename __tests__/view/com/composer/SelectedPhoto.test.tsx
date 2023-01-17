import React from 'react'
import {SelectedPhoto} from '../../../../src/view/com/composer/SelectedPhoto'
import {cleanup, fireEvent, render} from '../../../../jest/test-utils'

describe('SelectedPhoto', () => {
  const mockedProps = {
    selectedPhotos: ['mock-uri', 'mock-uri-2'],
    onSelectPhotos: jest.fn(),
  }

  afterAll(() => {
    jest.clearAllMocks()
    cleanup()
  })

  it('has no photos to render', () => {
    const {queryByTestId} = render(
      <SelectedPhoto selectedPhotos={[]} onSelectPhotos={jest.fn()} />,
    )
    const selectedPhotosView = queryByTestId('selectedPhotosView')
    expect(selectedPhotosView).toBeNull()

    const selectedPhotoImage = queryByTestId('selectedPhotoImage')
    expect(selectedPhotoImage).toBeNull()
  })

  it('has 1 photos to render', async () => {
    const {findByTestId} = render(
      <SelectedPhoto
        selectedPhotos={['mock-uri']}
        onSelectPhotos={jest.fn()}
      />,
    )
    const selectedPhotosView = await findByTestId('selectedPhotosView')
    expect(selectedPhotosView).toBeTruthy()

    const selectedPhotoImage = await findByTestId('selectedPhotoImage')
    expect(selectedPhotoImage).toBeTruthy()
    // @ts-expect-error
    expect(selectedPhotoImage).toHaveStyle({width: 250})
  })

  it('has 2 photos to render', async () => {
    const {findAllByTestId} = render(<SelectedPhoto {...mockedProps} />)
    const selectedPhotoImage = await findAllByTestId('selectedPhotoImage')
    expect(selectedPhotoImage[0]).toBeTruthy()
    // @ts-expect-error
    expect(selectedPhotoImage[0]).toHaveStyle({width: 175})
  })

  it('has 3 photos to render', async () => {
    const {findAllByTestId} = render(
      <SelectedPhoto
        selectedPhotos={['mock-uri', 'mock-uri-2', 'mock-uri-3']}
        onSelectPhotos={jest.fn()}
      />,
    )
    const selectedPhotoImage = await findAllByTestId('selectedPhotoImage')
    expect(selectedPhotoImage[0]).toBeTruthy()
    // @ts-expect-error
    expect(selectedPhotoImage[0]).toHaveStyle({width: 85})
  })

  it('removes a photo', async () => {
    const {findAllByTestId} = render(<SelectedPhoto {...mockedProps} />)
    const removePhotoButton = await findAllByTestId('removePhotoButton')
    fireEvent.press(removePhotoButton[0])
    expect(mockedProps.onSelectPhotos).toHaveBeenCalledWith(['mock-uri-2'])
  })
})
