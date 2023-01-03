import React from 'react'
import {ComposePost} from '../../../../src/view/com/composer/ComposePost'
import {fireEvent, render} from '../../../../jest/test-utils'
import * as apilib from '../../../../src/state/lib/api'
import {mockedRootStore} from '../../../../__mocks__/state-mock'
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

  // WIP
  // it('changes text and publishes post', async () => {
  //   const spyOnPost = jest.spyOn(apilib, 'post').mockResolvedValue({
  //     uri: '',
  //     cid: '',
  //   })
  //   const spyOnToast = jest.spyOn(Toast, 'show')

  //   const wrapper = render(<ComposePost {...mockedProps} />)

  //   const composerTextInput = await wrapper.findByTestId('composerTextInput')
  //   fireEvent.changeText(composerTextInput, 'testing publish')

  //   const composerPublishButton = await wrapper.findByTestId(
  //     'composerPublishButton',
  //   )
  //   fireEvent.press(composerPublishButton)

  //   expect(spyOnPost).toHaveBeenCalledWith(
  //     mockedRootStore,
  //     'testing publish',
  //     'testUri',
  //     [],
  //     new Set<string>(),
  //     expect.anything(),
  //   )
  //   expect(mockedRootStore.me.mainFeed.checkForLatest).toHaveBeenCalled()
  //   expect(mockedProps.onPost).toHaveBeenCalled()
  //   expect(mockedProps.onClose).toHaveBeenCalled()
  //   expect(spyOnToast).toHaveBeenCalledWith('Your reply has been published')
  // })

  it('matches snapshot', () => {
    const page = render(<ComposePost {...mockedProps} />)
    expect(page).toMatchSnapshot()
  })

  // composerSelectPhotosButton - onPressSelectPhotos
  // onSelectPhotos
  // onChangeText
})
