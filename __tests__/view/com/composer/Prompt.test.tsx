import React from 'react'
import {ComposePrompt} from '../../../../src/view/com/composer/Prompt'
import {fireEvent, render} from '../../../../jest/test-utils'
import {
  mockedMeStore,
  mockedNavigationStore,
} from '../../../../__mocks__/state-mock'

describe('Prompt', () => {
  const onPressMock = jest.fn()
  const mockedProps = {
    onPressCompose: onPressMock,
  }

  afterAll(() => {
    jest.clearAllMocks()
  })

  it('triggers onPressCompose by pressing the button', async () => {
    const {findByTestId} = render(<ComposePrompt {...mockedProps} />)
    const composePromptButton = await findByTestId('composePromptButton')
    fireEvent.press(composePromptButton)
    expect(onPressMock).toHaveBeenCalled()
  })

  it('triggers onPressAvatar by pressing the button', async () => {
    const {findByTestId} = render(<ComposePrompt {...mockedProps} />)
    const composePromptAvatarButton = await findByTestId(
      'composePromptAvatarButton',
    )
    fireEvent.press(composePromptAvatarButton)
    expect(mockedNavigationStore.navigate).toHaveBeenCalledWith(
      `/profile/${mockedMeStore.handle}`,
    )
  })

  it('matches snapshot', () => {
    const page = render(<ComposePrompt {...mockedProps} />)
    expect(page).toMatchSnapshot()
  })
})
