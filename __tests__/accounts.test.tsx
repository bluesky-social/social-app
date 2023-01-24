import React from 'react'
import {MobileShell} from '../src/view/shell/mobile'
import {cleanup, fireEvent, render, waitFor} from '../jest/test-utils'
import {createServer, TestPDS} from '../jest/test-pds'
import {RootStoreModel, setupState} from '../src/state'

const WAIT_OPTS = {timeout: 5e3}

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
    const {getByTestId} = render(<MobileShell />, rootStore)
    const signUpScreen = getByTestId('signinOrCreateAccount')

    expect(signUpScreen).toBeTruthy()
  })

  it('completes signin to the server', async () => {
    const {getByTestId} = render(<MobileShell />, rootStore)

    // move to signin view
    fireEvent.press(getByTestId('signInButton'))
    expect(getByTestId('signIn')).toBeTruthy()
    expect(getByTestId('loginForm')).toBeTruthy()

    // input the target server
    expect(getByTestId('loginSelectServiceButton')).toBeTruthy()
    fireEvent.press(getByTestId('loginSelectServiceButton'))
    expect(getByTestId('serverInputModal')).toBeTruthy()
    fireEvent.changeText(
      getByTestId('customServerTextInput'),
      pds?.pdsUrl || '',
    )
    fireEvent.press(getByTestId('customServerSelectBtn'))
    await waitFor(() => {
      expect(getByTestId('loginUsernameInput')).toBeTruthy()
    }, WAIT_OPTS)

    // enter username & pass
    fireEvent.changeText(getByTestId('loginUsernameInput'), 'alice')
    fireEvent.changeText(getByTestId('loginPasswordInput'), 'hunter2')
    await waitFor(() => {
      expect(getByTestId('loginNextButton')).toBeTruthy()
    }, WAIT_OPTS)
    fireEvent.press(getByTestId('loginNextButton'))

    // signed in
    await waitFor(() => {
      expect(getByTestId('homeFeed')).toBeTruthy()
      expect(rootStore?.me?.displayName).toBe('Alice')
      expect(rootStore?.me?.handle).toBe('alice.test')
      expect(rootStore?.session.accounts.length).toBe(1)
    }, WAIT_OPTS)
    expect(rootStore?.me?.displayName).toBe('Alice')
    expect(rootStore?.me?.handle).toBe('alice.test')
    expect(rootStore?.session.accounts.length).toBe(1)
  })

  it('opens the login screen when "add account" is pressed', async () => {
    const {getByTestId, getAllByTestId} = render(<MobileShell />, rootStore)
    await waitFor(() => expect(getByTestId('homeFeed')).toBeTruthy(), WAIT_OPTS)

    // open side menu
    fireEvent.press(getAllByTestId('viewHeaderBackOrMenuBtn')[0])
    await waitFor(() => expect(getByTestId('menuView')).toBeTruthy(), WAIT_OPTS)

    // nav to settings
    fireEvent.press(getByTestId('menuItemButton-Settings'))
    await waitFor(
      () => expect(getByTestId('settingsScreen')).toBeTruthy(),
      WAIT_OPTS,
    )

    // press '+ new account' in switcher
    fireEvent.press(getByTestId('switchToNewAccountBtn'))
    await waitFor(
      () => expect(getByTestId('signinOrCreateAccount')).toBeTruthy(),
      WAIT_OPTS,
    )
  })

  it('shows the "choose account" form when a previous session has been created', async () => {
    const {getByTestId} = render(<MobileShell />, rootStore)

    // move to signin view
    fireEvent.press(getByTestId('signInButton'))
    expect(getByTestId('signIn')).toBeTruthy()
    expect(getByTestId('chooseAccountForm')).toBeTruthy()
  })

  it('logs directly into the account due to still possessing session tokens', async () => {
    const {getByTestId} = render(<MobileShell />, rootStore)

    // move to signin view
    fireEvent.press(getByTestId('signInButton'))
    expect(getByTestId('signIn')).toBeTruthy()
    expect(getByTestId('chooseAccountForm')).toBeTruthy()

    // select the previous account
    fireEvent.press(getByTestId('chooseAccountBtn-alice.test'))

    // signs in immediately
    await waitFor(() => {
      expect(getByTestId('homeFeed')).toBeTruthy()
      expect(rootStore?.me?.displayName).toBe('Alice')
      expect(rootStore?.me?.handle).toBe('alice.test')
      expect(rootStore?.session.accounts.length).toBe(1)
    }, WAIT_OPTS)
    expect(rootStore?.me?.displayName).toBe('Alice')
    expect(rootStore?.me?.handle).toBe('alice.test')
    expect(rootStore?.session.accounts.length).toBe(1)
  })

  it('logs into a second account via the switcher', async () => {
    const {getByTestId, getAllByTestId} = render(<MobileShell />, rootStore)
    await waitFor(() => expect(getByTestId('homeFeed')).toBeTruthy(), WAIT_OPTS)

    // open side menu
    fireEvent.press(getAllByTestId('viewHeaderBackOrMenuBtn')[0])
    await waitFor(() => expect(getByTestId('menuView')).toBeTruthy(), WAIT_OPTS)

    // nav to settings
    fireEvent.press(getByTestId('menuItemButton-Settings'))
    await waitFor(
      () => expect(getByTestId('settingsScreen')).toBeTruthy(),
      WAIT_OPTS,
    )

    // press '+ new account' in switcher
    fireEvent.press(getByTestId('switchToNewAccountBtn'))
    await waitFor(
      () => expect(getByTestId('signinOrCreateAccount')).toBeTruthy(),
      WAIT_OPTS,
    )

    // move to signin view
    fireEvent.press(getByTestId('signInButton'))
    expect(getByTestId('signIn')).toBeTruthy()
    expect(getByTestId('chooseAccountForm')).toBeTruthy()

    // select a new account
    fireEvent.press(getByTestId('chooseNewAccountBtn'))
    expect(getByTestId('loginForm')).toBeTruthy()

    // input the target server
    expect(getByTestId('loginSelectServiceButton')).toBeTruthy()
    fireEvent.press(getByTestId('loginSelectServiceButton'))
    expect(getByTestId('serverInputModal')).toBeTruthy()
    fireEvent.changeText(
      getByTestId('customServerTextInput'),
      pds?.pdsUrl || '',
    )
    fireEvent.press(getByTestId('customServerSelectBtn'))
    await waitFor(
      () => expect(getByTestId('loginUsernameInput')).toBeTruthy(),
      WAIT_OPTS,
    )

    // enter username & pass
    fireEvent.changeText(getByTestId('loginUsernameInput'), 'bob')
    fireEvent.changeText(getByTestId('loginPasswordInput'), 'hunter2')
    await waitFor(
      () => expect(getByTestId('loginNextButton')).toBeTruthy(),
      WAIT_OPTS,
    )
    fireEvent.press(getByTestId('loginNextButton'))

    // signed in
    await waitFor(() => {
      expect(getByTestId('settingsScreen')).toBeTruthy() // we go back to settings in this situation
      expect(rootStore?.me?.displayName).toBe('Bob')
      expect(rootStore?.me?.handle).toBe('bob.test')
      expect(rootStore?.session.accounts.length).toBe(2)
    }, WAIT_OPTS)
    expect(rootStore?.me?.displayName).toBe('Bob')
    expect(rootStore?.me?.handle).toBe('bob.test')
    expect(rootStore?.session.accounts.length).toBe(2)
  })

  it('can instantly switch between accounts', async () => {
    const {getByTestId} = render(<MobileShell />, rootStore)
    await waitFor(
      () => expect(getByTestId('settingsScreen')).toBeTruthy(),
      WAIT_OPTS,
    )

    // select the alice account
    fireEvent.press(getByTestId('switchToAccountBtn-alice.test'))

    // swapped account
    await waitFor(() => {
      expect(rootStore?.me?.displayName).toBe('Alice')
      expect(rootStore?.me?.handle).toBe('alice.test')
      expect(rootStore?.session.accounts.length).toBe(2)
    }, WAIT_OPTS)
    expect(rootStore?.me?.displayName).toBe('Alice')
    expect(rootStore?.me?.handle).toBe('alice.test')
    expect(rootStore?.session.accounts.length).toBe(2)
  })

  it('will prompt for a password if you sign out', async () => {
    const {getByTestId} = render(<MobileShell />, rootStore)
    await waitFor(
      () => expect(getByTestId('settingsScreen')).toBeTruthy(),
      WAIT_OPTS,
    )

    // press the sign out button
    fireEvent.press(getByTestId('signOutBtn'))

    // in the logged out state
    await waitFor(
      () => expect(getByTestId('signinOrCreateAccount')).toBeTruthy(),
      WAIT_OPTS,
    )

    // move to signin view
    fireEvent.press(getByTestId('signInButton'))
    expect(getByTestId('signIn')).toBeTruthy()
    expect(getByTestId('chooseAccountForm')).toBeTruthy()

    // select an existing account
    fireEvent.press(getByTestId('chooseAccountBtn-alice.test'))

    // goes to login screen instead of straight back to settings
    expect(getByTestId('loginForm')).toBeTruthy()
  })
})
