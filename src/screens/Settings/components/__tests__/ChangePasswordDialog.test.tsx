import {act} from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {com} from '#/lexicons'
import {ChangePasswordDialog} from '../ChangePasswordDialog'

const mockCall = jest.fn()
const mockClose = jest.fn<void, [(() => void)?]>()

jest.mock('@lingui/react', () => ({
  useLingui: () => ({_: (value: {message: string}) => value.message}),
  Trans: ({message}: {message?: string}) => message ?? null,
}))
jest.mock('#/state/session', () => ({
  usePdsClient: () => ({call: mockCall}),
  useSession: () => ({currentAccount: {email: 'alice@example.com'}}),
  useSessionApi: () => ({logoutCurrentAccount: jest.fn()}),
}))
jest.mock('#/logger', () => ({logger: {error: jest.fn()}}))
jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: () => ({})}),
  android: () => ({}),
  web: () => ({}),
}))
jest.mock('#/components/Dialog', () => ({
  Outer: ({
    children,
    preventDismiss,
  }: {
    children: React.ReactNode
    preventDismiss?: boolean
  }) => {
    const {View} = require('react-native') as typeof import('react-native')
    return (
      <View testID="dialogOuter" accessibilityState={{busy: !!preventDismiss}}>
        {children}
      </View>
    )
  },
  Handle: () => null,
  ScrollableInner: ({children}: {children: React.ReactNode}) => <>{children}</>,
  Close: () => null,
  useDialogContext: () => ({close: mockClose}),
}))
jest.mock('#/components/Button', () => {
  const {Pressable, Text} =
    require('react-native') as typeof import('react-native')
  return {
    Button: ({
      label,
      onPress,
      disabled,
      children,
    }: {
      label: string
      onPress?: () => void
      disabled?: boolean
      children: React.ReactNode
    }) => (
      <Pressable
        accessibilityRole="button"
        aria-label={label}
        onPress={onPress}
        disabled={disabled}>
        {children}
      </Pressable>
    ),
    ButtonText: ({children}: {children: React.ReactNode}) => (
      <Text>{children}</Text>
    ),
    ButtonIcon: () => null,
  }
})
jest.mock('#/components/Loader', () => ({Loader: () => null}))
jest.mock('#/components/Toast', () => ({show: jest.fn()}))
jest.mock('#/components/Typography', () => {
  const {Text} = require('react-native') as typeof import('react-native')
  return {Text}
})
jest.mock('#/view/com/util/error/ErrorMessage', () => {
  const {Text} = require('react-native') as typeof import('react-native')
  return {
    ErrorMessage: ({message}: {message: string}) => <Text>{message}</Text>,
  }
})
jest.mock('#/env', () => ({IS_NATIVE: false}))
jest.mock('#/components/forms/TextField', () => ({
  LabelText: ({children}: {children: React.ReactNode}) => <>{children}</>,
}))
jest.mock('#/components/dialogs/EmailDialog/components/TokenField', () => {
  const {TextInput} = require('react-native') as typeof import('react-native')
  return {
    TokenField: (props: React.ComponentProps<typeof TextInput>) => (
      <TextInput {...props} testID="resetCode" />
    ),
  }
})
jest.mock('#/components/forms/PasswordField', () => {
  const {TextInput} = require('react-native') as typeof import('react-native')
  return {
    PasswordField: ({
      label,
      ...rest
    }: React.ComponentProps<typeof TextInput> & {label: string}) => (
      <TextInput {...rest} testID="newPassword" aria-label={label} />
    ),
  }
})

const control = {open: jest.fn(), close: jest.fn()}

function renderDialog() {
  render(
    <ChangePasswordDialog
      control={
        control as unknown as React.ComponentProps<
          typeof ChangePasswordDialog
        >['control']
      }
    />,
  )
}

function enterCodeStage() {
  fireEvent.press(screen.getByLabelText('Already have a code?'))
}

async function submit() {
  await act(async () => {
    fireEvent.press(screen.getByLabelText('Change password'))
    await Promise.resolve()
  })
}

function deferred() {
  let resolve!: (value: unknown) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return {promise, resolve, reject}
}

function isDismissPrevented() {
  const state = screen.getByTestId('dialogOuter').props.accessibilityState as {
    busy: boolean
  }
  return state.busy
}

function isDisabled(label: string) {
  const state = screen.getByLabelText(label).props.accessibilityState as
    {disabled?: boolean} | undefined
  return !!state?.disabled
}

function fillCodeStage() {
  enterCodeStage()
  fireEvent.changeText(screen.getByTestId('resetCode'), 'abcde23456')
  fireEvent.changeText(screen.getByTestId('newPassword'), 'new-password')
}

describe('ChangePasswordDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCall.mockResolvedValue({})
  })

  it('locks dismissal while a reset is pending, until the programmatic close', async () => {
    const request = deferred()
    mockCall.mockReturnValueOnce(request.promise)
    renderDialog()
    expect(isDismissPrevented()).toBe(false)
    fillCodeStage()
    await submit()

    expect(mockCall).toHaveBeenCalledWith(com.atproto.server.resetPassword, {
      token: 'ABCDE-23456',
      password: 'new-password',
    })
    expect(isDismissPrevented()).toBe(true)
    expect(isDisabled('Change password')).toBe(true)
    expect(isDisabled('Back')).toBe(true)
    expect(mockClose).not.toHaveBeenCalled()

    await act(async () => {
      request.resolve({})
      await request.promise
    })

    // Still locked for the user, but the programmatic close is requested.
    expect(isDismissPrevented()).toBe(true)
    expect(mockClose).toHaveBeenCalledTimes(1)
    expect(mockClose).toHaveBeenCalledWith(expect.any(Function))
  })

  it('restores dismissal when a reset fails, and a retry can succeed', async () => {
    const request = deferred()
    mockCall.mockReturnValueOnce(request.promise)
    renderDialog()
    fillCodeStage()
    await submit()
    expect(isDismissPrevented()).toBe(true)

    await act(async () => {
      request.reject(new Error('Network request failed'))
      await request.promise.catch(() => {})
    })

    expect(isDismissPrevented()).toBe(false)
    expect(isDisabled('Change password')).toBe(false)
    expect(mockClose).not.toHaveBeenCalled()

    await submit()
    expect(mockCall).toHaveBeenCalledTimes(2)
    expect(mockClose).toHaveBeenCalledTimes(1)
  })

  it('locks dismissal while requesting a code, then releases it', async () => {
    const request = deferred()
    mockCall.mockReturnValueOnce(request.promise)
    renderDialog()
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Request code'))
      await Promise.resolve()
    })
    expect(isDismissPrevented()).toBe(true)

    await act(async () => {
      request.resolve({})
      await request.promise
    })

    expect(isDismissPrevented()).toBe(false)
    expect(mockClose).not.toHaveBeenCalled()
  })
})
