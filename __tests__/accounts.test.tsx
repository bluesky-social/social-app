import React from 'react'
import {Login} from '../src/view/screens/Login'
import {cleanup, fireEvent, render} from '../jest/test-utils'
import {createServer, TestPDS} from '../jest/test-pds'
import {RootStoreModel, setupState} from '../src/state'

describe('Account flows', () => {
  let pds: TestPDS | undefined
  let rootStore: RootStoreModel | undefined
  beforeAll(async () => {
    jest.useFakeTimers()
    pds = await createServer()
    rootStore = await setupState(pds.pdsUrl)
  })

  afterAll(async () => {
    jest.clearAllMocks()
    cleanup()
    await pds?.close()
  })

  it('renders initial screen', () => {
    const {getByTestId} = render(<Login />, rootStore)
    const signUpScreen = getByTestId('signinOrCreateAccount')

    expect(signUpScreen).toBeTruthy()
  })

  // it('renders Signin screen', () => {
  //   const {getByTestId} = render(<Login />)
  //   const signInButton = getByTestId('signInButton')

  //   fireEvent.press(signInButton)

  //   const signInScreen = getByTestId('signIn')
  //   expect(signInScreen).toBeTruthy()
  // })

  // it('renders CreateAccount screen', () => {
  //   const {getByTestId} = render(<Login />)
  //   const createAccountButton = getByTestId('createAccountButton')

  //   fireEvent.press(createAccountButton)

  //   const createAccountScreen = getByTestId('createAccount')
  //   expect(createAccountScreen).toBeTruthy()
  // })
})
