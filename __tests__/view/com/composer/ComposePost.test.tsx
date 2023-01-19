import React from 'react'
import {ComposePost} from '../../../../src/view/com/composer/ComposePost'
import {cleanup, fireEvent, render, waitFor} from '../../../../jest/test-utils'
import * as apilib from '../../../../src/state/lib/api'
import {
  mockedAutocompleteViewStore,
  mockedRootStore,
} from '../../../../__mocks__/state-mock'
import Toast from 'react-native-root-toast'

describe('ComposePost', () => {
  const mockedProps = {
    replyTo: {
      uri: 'testUri',
      cid: 'testCid',
      text: 'testText',
      author: {
        handle: 'test.handle',
        displayName: 'test name',
        avatar: '',
      },
    },
    onPost: jest.fn(),
    onClose: jest.fn(),
  }

  afterAll(() => {
    jest.clearAllMocks()
    cleanup()
  })

  it('renders post composer', async () => {
    const {findByTestId} = render(<ComposePost {...mockedProps} />)
    const composePostView = await findByTestId('composePostView')
    expect(composePostView).toBeTruthy()
  })

  it('closes composer', async () => {
    const {findByTestId} = render(<ComposePost {...mockedProps} />)
    const composerCancelButton = await findByTestId('composerCancelButton')
    fireEvent.press(composerCancelButton)
    expect(mockedProps.onClose).toHaveBeenCalled()
  })

  it('changes text and publishes post', async () => {
    const postSpy = jest.spyOn(apilib, 'post').mockResolvedValue({
      uri: '',
      cid: '',
    })
    const toastSpy = jest.spyOn(Toast, 'show')

    const wrapper = render(<ComposePost {...mockedProps} />)

    const composerTextInput = await wrapper.findByTestId('composerTextInput')
    fireEvent.changeText(composerTextInput, 'testing publish')

    const composerPublishButton = await wrapper.findByTestId(
      'composerPublishButton',
    )
    fireEvent.press(composerPublishButton)

    expect(postSpy).toHaveBeenCalledWith(
      mockedRootStore,
      'testing publish',
      'testUri',
      undefined,
      [],
      new Set<string>(),
      expect.anything(),
    )

    // Waits for request to be resolved
    await waitFor(() => {
      expect(mockedProps.onPost).toHaveBeenCalled()
      expect(mockedProps.onClose).toHaveBeenCalled()
      expect(toastSpy).toHaveBeenCalledWith('Your reply has been published', {
        animation: true,
        duration: 3500,
        hideOnPress: true,
        position: 50,
        shadow: true,
      })
    })
  })

  it('selects autocomplete item', async () => {
    jest
      .spyOn(React, 'useMemo')
      .mockReturnValueOnce(mockedAutocompleteViewStore)

    const {findAllByTestId} = render(<ComposePost {...mockedProps} />)
    const autocompleteButton = await findAllByTestId('autocompleteButton')

    fireEvent.press(autocompleteButton[0])
    expect(mockedAutocompleteViewStore.setActive).toHaveBeenCalledWith(false)
  })

  it('selects photos', async () => {
    const {findByTestId, queryByTestId} = render(
      <ComposePost {...mockedProps} />,
    )
    let photoCarouselPickerView = queryByTestId('photoCarouselPickerView')
    expect(photoCarouselPickerView).toBeFalsy()

    const composerSelectPhotosButton = await findByTestId(
      'composerSelectPhotosButton',
    )
    fireEvent.press(composerSelectPhotosButton)

    photoCarouselPickerView = await findByTestId('photoCarouselPickerView')
    expect(photoCarouselPickerView).toBeTruthy()

    fireEvent.press(composerSelectPhotosButton)

    photoCarouselPickerView = queryByTestId('photoCarouselPickerView')
    expect(photoCarouselPickerView).toBeFalsy()
  })
})
