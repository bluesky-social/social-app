import React from 'react'
import {Keyboard} from 'react-native'
import {CreateAccount} from '../../../../src/view/com/login/CreateAccount'
import {cleanup, fireEvent, render} from '../../../../jest/test-utils'
import {
  mockedSessionStore,
  mockedShellStore,
} from '../../../../__mocks__/state-mock'

describe('CreateAccount', () => {
  const mockedProps = {
    onPressBack: jest.fn(),
  }
  afterAll(() => {
    jest.clearAllMocks()
    cleanup()
  })

  it('renders form and creates new account', async () => {
    const {findByTestId} = render(<CreateAccount {...mockedProps} />)

    const registerEmailInput = await findByTestId('registerEmailInput')
    expect(registerEmailInput).toBeTruthy()
    fireEvent.changeText(registerEmailInput, 'test@email.com')

    const registerHandleInput = await findByTestId('registerHandleInput')
    expect(registerHandleInput).toBeTruthy()
    fireEvent.changeText(registerHandleInput, 'test.handle')

    const registerPasswordInput = await findByTestId('registerPasswordInput')
    expect(registerPasswordInput).toBeTruthy()
    fireEvent.changeText(registerPasswordInput, 'testpass')

    const registerIs13Input = await findByTestId('registerIs13Input')
    expect(registerIs13Input).toBeTruthy()
    fireEvent.press(registerIs13Input)

    const createAccountButton = await findByTestId('createAccountButton')
    expect(createAccountButton).toBeTruthy()
    fireEvent.press(createAccountButton)

    expect(mockedSessionStore.createAccount).toHaveBeenCalled()
  })

  it('renders and selects service', async () => {
    const keyboardSpy = jest.spyOn(Keyboard, 'dismiss')
    const {findByTestId} = render(<CreateAccount {...mockedProps} />)

    const registerSelectServiceButton = await findByTestId(
      'registerSelectServiceButton',
    )
    expect(registerSelectServiceButton).toBeTruthy()
    fireEvent.press(registerSelectServiceButton)

    expect(mockedShellStore.openModal).toHaveBeenCalled()
    expect(keyboardSpy).toHaveBeenCalled()
  })
})
