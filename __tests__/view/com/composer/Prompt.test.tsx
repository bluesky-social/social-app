import React from 'react'
import {ComposePrompt} from '../../../../src/view/com/composer/Prompt'
import {cleanup, fireEvent, render} from '../../../../jest/test-utils'

describe('Prompt', () => {
  const onPressMock = jest.fn()
  const mockedProps = {
    onPressCompose: onPressMock,
  }

  afterAll(() => {
    jest.clearAllMocks()
    cleanup()
  })

  it('triggers onPressCompose by pressing the button', async () => {
    const {findByTestId} = render(<ComposePrompt {...mockedProps} />)
    const composePromptButton = await findByTestId('composePromptButton')
    fireEvent.press(composePromptButton)
    expect(onPressMock).toHaveBeenCalled()
  })

  it('matches snapshot', () => {
    const page = render(<ComposePrompt {...mockedProps} />)
    expect(page).toMatchSnapshot()
  })
})
