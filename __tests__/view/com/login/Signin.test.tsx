import React from 'react'
import {Signin} from '../../../../src/view/com/login/Signin'
import {cleanup, fireEvent, render} from '../../../../jest/test-utils'
import {SessionServiceClient, sessionClient as AtpApi} from '@atproto/api'
import {
  mockedSessionStore,
  mockedShellStore,
} from '../../../../__mocks__/state-mock'
import {Keyboard} from 'react-native'

describe('Signin', () => {
  const requestPasswordResetMock = jest.fn()
  const resetPasswordMock = jest.fn()
  jest.spyOn(AtpApi, 'service').mockReturnValue({
    com: {
      atproto: {
        account: {
          requestPasswordReset: requestPasswordResetMock,
          resetPassword: resetPasswordMock,
        },
      },
    },
  } as unknown as SessionServiceClient)
  const mockedProps = {
    onPressBack: jest.fn(),
  }
  afterAll(() => {
    jest.clearAllMocks()
    cleanup()
  })

  it('renders logs in form', async () => {
    const {findByTestId} = render(<Signin {...mockedProps} />)

    const loginFormView = await findByTestId('loginFormView')
    expect(loginFormView).toBeTruthy()

    const loginUsernameInput = await findByTestId('loginUsernameInput')
    expect(loginUsernameInput).toBeTruthy()

    fireEvent.changeText(loginUsernameInput, 'testusername')

    const loginPasswordInput = await findByTestId('loginPasswordInput')
    expect(loginPasswordInput).toBeTruthy()

    fireEvent.changeText(loginPasswordInput, 'test pass')

    const loginNextButton = await findByTestId('loginNextButton')
    expect(loginNextButton).toBeTruthy()

    fireEvent.press(loginNextButton)

    expect(mockedSessionStore.login).toHaveBeenCalled()
  })

  it('renders selects service from login form', async () => {
    const keyboardSpy = jest.spyOn(Keyboard, 'dismiss')
    const {findByTestId} = render(<Signin {...mockedProps} />)

    const loginSelectServiceButton = await findByTestId(
      'loginSelectServiceButton',
    )
    expect(loginSelectServiceButton).toBeTruthy()

    fireEvent.press(loginSelectServiceButton)

    expect(mockedShellStore.openModal).toHaveBeenCalled()
    expect(keyboardSpy).toHaveBeenCalled()
  })

  it('renders new password form', async () => {
    const {findByTestId} = render(<Signin {...mockedProps} />)

    const forgotPasswordButton = await findByTestId('forgotPasswordButton')
    expect(forgotPasswordButton).toBeTruthy()

    fireEvent.press(forgotPasswordButton)
    const forgotPasswordView = await findByTestId('forgotPasswordView')
    expect(forgotPasswordView).toBeTruthy()

    const forgotPasswordEmail = await findByTestId('forgotPasswordEmail')
    expect(forgotPasswordEmail).toBeTruthy()
    fireEvent.changeText(forgotPasswordEmail, 'test@email.com')

    const newPasswordButton = await findByTestId('newPasswordButton')
    expect(newPasswordButton).toBeTruthy()
    fireEvent.press(newPasswordButton)

    expect(requestPasswordResetMock).toHaveBeenCalled()

    const newPasswordView = await findByTestId('newPasswordView')
    expect(newPasswordView).toBeTruthy()

    const newPasswordInput = await findByTestId('newPasswordInput')
    expect(newPasswordInput).toBeTruthy()
    const resetCodeInput = await findByTestId('resetCodeInput')
    expect(resetCodeInput).toBeTruthy()

    fireEvent.changeText(newPasswordInput, 'test pass')
    fireEvent.changeText(resetCodeInput, 'test reset code')

    const setNewPasswordButton = await findByTestId('setNewPasswordButton')
    expect(setNewPasswordButton).toBeTruthy()

    fireEvent.press(setNewPasswordButton)

    expect(resetPasswordMock).toHaveBeenCalled()
  })

  it('renders forgot password form', async () => {
    const {findByTestId} = render(<Signin {...mockedProps} />)

    const forgotPasswordButton = await findByTestId('forgotPasswordButton')
    expect(forgotPasswordButton).toBeTruthy()

    fireEvent.press(forgotPasswordButton)
    const forgotPasswordSelectServiceButton = await findByTestId(
      'forgotPasswordSelectServiceButton',
    )
    expect(forgotPasswordSelectServiceButton).toBeTruthy()

    fireEvent.press(forgotPasswordSelectServiceButton)

    expect(mockedShellStore.openModal).toHaveBeenCalled()
  })
})
