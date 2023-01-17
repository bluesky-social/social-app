import React from 'react'
import {Login} from '../../../src/view/screens/Login'
import {cleanup, fireEvent, render} from '../../../jest/test-utils'

describe('Login', () => {
  afterAll(() => {
    jest.clearAllMocks()
    cleanup()
  })

  it('renders initial screen', () => {
    const {getByTestId} = render(<Login />)
    const signUpScreen = getByTestId('signinOrCreateAccount')

    expect(signUpScreen).toBeTruthy()
  })

  it('renders Signin screen', () => {
    const {getByTestId} = render(<Login />)
    const signInButton = getByTestId('signInButton')

    fireEvent.press(signInButton)

    const signInScreen = getByTestId('signIn')
    expect(signInScreen).toBeTruthy()
  })

  it('renders CreateAccount screen', () => {
    const {getByTestId} = render(<Login />)
    const createAccountButton = getByTestId('createAccountButton')

    fireEvent.press(createAccountButton)

    const createAccountScreen = getByTestId('createAccount')
    expect(createAccountScreen).toBeTruthy()
  })
})
