import {act} from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {com} from '#/lexicons'
import {ChangePasswordDialog} from '../ChangePasswordDialog'

const mockCall = jest.fn()
const mockClose = jest.fn<void, [(() => void)?]>()
const mockLogoutCurrentAccount = jest.fn()
const mockCreateSession = jest.fn()
const mockRefreshSession = jest.fn()
const mockToastShow = jest.fn()

jest.mock('@lingui/react', () => ({
  useLingui: () => ({_: (value: {message: string}) => value.message}),
  Trans: ({message}: {message?: string}) => message ?? null,
}))
jest.mock('#/state/session', () => ({
  usePdsClient: () => ({call: mockCall}),
  useSession: () => ({currentAccount: {email: 'alice@example.com'}}),
  useSessionApi: () => ({
    logoutCurrentAccount: mockLogoutCurrentAccount,
    createSession: mockCreateSession,
    refreshSession: mockRefreshSession,
  }),
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
jest.mock('#/components/Toast', () => ({
  show: (...args: unknown[]) => mockToastShow(...args),
}))
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

  it('warns that changing the password signs the user out', () => {
    renderDialog()
    expect(
      screen.getByText(/Changing your password will sign you out/),
    ).toBeTruthy()
    enterCodeStage()
    expect(
      screen.getByText(/Changing your password will sign you out/),
    ).toBeTruthy()
  })

  it('logs out and toasts only after the dialog has closed', async () => {
    renderDialog()
    enterCodeStage()
    fireEvent.changeText(screen.getByTestId('resetCode'), 'abcde23456')
    fireEvent.changeText(screen.getByTestId('newPassword'), 'new-password')
    await submit()

    expect(mockCall).toHaveBeenCalledTimes(1)
    expect(mockCall).toHaveBeenCalledWith(com.atproto.server.resetPassword, {
      token: 'ABCDE-23456',
      password: 'new-password',
    })
    expect(mockClose).toHaveBeenCalledTimes(1)
    expect(mockLogoutCurrentAccount).not.toHaveBeenCalled()
    expect(mockToastShow).not.toHaveBeenCalled()

    const onClosed = mockClose.mock.calls[0]?.[0]
    onClosed?.()
    expect(mockLogoutCurrentAccount).toHaveBeenCalledTimes(1)
    expect(mockLogoutCurrentAccount).toHaveBeenCalledWith('Settings')
    expect(mockToastShow).toHaveBeenCalledWith(
      'Password successfully reset. Please sign in with your new password.',
      {type: 'success'},
    )
    expect(mockCreateSession).not.toHaveBeenCalled()
    expect(mockRefreshSession).not.toHaveBeenCalled()
  })

  it('stays signed in and can retry when the reset fails', async () => {
    mockCall.mockRejectedValueOnce(new Error('Network request failed'))
    renderDialog()
    enterCodeStage()
    fireEvent.changeText(screen.getByTestId('resetCode'), 'abcde23456')
    fireEvent.changeText(screen.getByTestId('newPassword'), 'new-password')
    await submit()

    expect(screen.getByText(/Unable to contact your service/)).toBeTruthy()
    expect(
      screen.getByLabelText('Change password').props.accessibilityState,
    ).toMatchObject({disabled: false})
    expect(mockClose).not.toHaveBeenCalled()
    expect(mockLogoutCurrentAccount).not.toHaveBeenCalled()
    expect(mockToastShow).not.toHaveBeenCalled()
  })

  it('does not submit or log out on a validation failure', async () => {
    renderDialog()
    enterCodeStage()
    fireEvent.changeText(screen.getByTestId('resetCode'), 'abcde23456')
    fireEvent.changeText(screen.getByTestId('newPassword'), 'short')
    await submit()

    expect(screen.getByText(/at least 8 characters/)).toBeTruthy()
    expect(mockCall).not.toHaveBeenCalled()
    expect(mockClose).not.toHaveBeenCalled()
    expect(mockLogoutCurrentAccount).not.toHaveBeenCalled()
  })

  it('does not log out when only requesting a reset code', async () => {
    renderDialog()
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Request code'))
      await Promise.resolve()
    })

    expect(mockCall).toHaveBeenCalledWith(
      com.atproto.server.requestPasswordReset,
      {email: 'alice@example.com'},
    )
    expect(mockClose).not.toHaveBeenCalled()
    expect(mockLogoutCurrentAccount).not.toHaveBeenCalled()
  })

  describe('while a request is pending', () => {
    it('prevents dismissal until a successful reset closes the dialog', async () => {
      const request = deferred()
      mockCall.mockReturnValueOnce(request.promise)
      renderDialog()
      expect(isDismissPrevented()).toBe(false)
      fillCodeStage()
      await submit()

      expect(isDismissPrevented()).toBe(true)
      expect(isDisabled('Change password')).toBe(true)
      expect(isDisabled('Back')).toBe(true)
      expect(mockClose).not.toHaveBeenCalled()
      expect(mockLogoutCurrentAccount).not.toHaveBeenCalled()
      expect(mockToastShow).not.toHaveBeenCalled()

      await act(async () => {
        request.resolve({})
        await request.promise
      })

      // Still locked for the user, but the programmatic close is requested.
      expect(isDismissPrevented()).toBe(true)
      expect(mockClose).toHaveBeenCalledTimes(1)
      expect(mockClose).toHaveBeenCalledWith(expect.any(Function))
      expect(mockLogoutCurrentAccount).not.toHaveBeenCalled()
      expect(mockToastShow).not.toHaveBeenCalled()

      mockClose.mock.calls[0]?.[0]?.()
      expect(mockLogoutCurrentAccount).toHaveBeenCalledTimes(1)
      expect(mockLogoutCurrentAccount).toHaveBeenCalledWith('Settings')
      expect(mockToastShow).toHaveBeenCalledTimes(1)
    })

    it('restores dismissal when the reset fails, and a retry can succeed', async () => {
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
      expect(mockLogoutCurrentAccount).not.toHaveBeenCalled()
      expect(mockToastShow).not.toHaveBeenCalled()

      await submit()
      expect(mockCall).toHaveBeenCalledTimes(2)
      expect(mockClose).toHaveBeenCalledTimes(1)
      mockClose.mock.calls[0]?.[0]?.()
      expect(mockLogoutCurrentAccount).toHaveBeenCalledTimes(1)
      expect(mockToastShow).toHaveBeenCalledTimes(1)
    })

    it('prevents dismissal while requesting a code, then releases it without logging out', async () => {
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
      expect(mockLogoutCurrentAccount).not.toHaveBeenCalled()
    })

    it('does not prevent dismissal on a validation failure', async () => {
      renderDialog()
      enterCodeStage()
      fireEvent.changeText(screen.getByTestId('resetCode'), 'abcde23456')
      fireEvent.changeText(screen.getByTestId('newPassword'), 'short')
      await submit()

      expect(mockCall).not.toHaveBeenCalled()
      expect(isDismissPrevented()).toBe(false)
    })
  })
})
