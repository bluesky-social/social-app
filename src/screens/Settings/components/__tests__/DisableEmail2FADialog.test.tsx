import {act} from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {com} from '#/lexicons'
import {DisableEmail2FADialog} from '../DisableEmail2FADialog'

const mockCall = jest.fn()
const mockRefreshSession = jest.fn()
const mockToastShow = jest.fn()

jest.mock('@lingui/react', () => ({
  useLingui: () => ({_: (value: {message: string}) => value.message}),
  Trans: ({message}: {message?: string}) => message ?? null,
}))
jest.mock('#/state/session', () => ({
  usePdsClient: () => ({call: mockCall}),
  useSession: () => ({currentAccount: {email: 'alice@example.com'}}),
  useSessionApi: () => ({refreshSession: mockRefreshSession}),
}))
jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: () => ({})}),
  useBreakpoints: () => ({gtMobile: true}),
  useTheme: () => ({atoms: {text: {}}}),
}))
jest.mock('#/components/Dialog', () => ({
  Outer: ({children}: {children: React.ReactNode}) => <>{children}</>,
  Handle: () => null,
  ScrollableInner: ({children}: {children: React.ReactNode}) => <>{children}</>,
}))
jest.mock('#/components/Button', () => {
  const {Pressable, Text} =
    require('react-native') as typeof import('react-native')
  return {
    Button: ({
      testID,
      onPress,
      disabled,
      children,
    }: {
      testID?: string
      onPress?: () => void
      disabled?: boolean
      children: React.ReactNode
    }) => (
      <Pressable
        accessibilityRole="button"
        testID={testID}
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
  return {Text, P: Text}
})
jest.mock('#/view/com/util/error/ErrorMessage', () => {
  const {Text} = require('react-native') as typeof import('react-native')
  return {
    ErrorMessage: ({message}: {message: string}) => <Text>{message}</Text>,
  }
})
jest.mock('#/env', () => ({IS_NATIVE: false}))
jest.mock('#/components/icons/Shield', () => ({
  Shield_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/forms/TextField', () => {
  const {TextInput, View} =
    require('react-native') as typeof import('react-native')
  return {
    LabelText: ({children}: {children: React.ReactNode}) => <>{children}</>,
    Root: ({children}: {children: React.ReactNode}) => <View>{children}</View>,
    Icon: () => null,
    Input: ({
      label,
      isInvalid,
      ...rest
    }: React.ComponentProps<typeof TextInput> & {
      label: string
      isInvalid?: boolean
    }) => (
      <TextInput
        {...rest}
        aria-label={label}
        aria-invalid={isInvalid ? true : undefined}
      />
    ),
  }
})

function renderDialog() {
  const control = {open: jest.fn(), close: jest.fn()}
  render(
    <DisableEmail2FADialog
      control={
        control as unknown as React.ComponentProps<
          typeof DisableEmail2FADialog
        >['control']
      }
    />,
  )
  return control
}

function getInput() {
  return screen.getByTestId('confirmationCode')
}

function enterCodeStage() {
  fireEvent.press(screen.getByTestId('haveCodeButton'))
}

describe('DisableEmail2FADialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCall.mockResolvedValue({})
    mockRefreshSession.mockResolvedValue(undefined)
  })

  it('requests an email and reveals the code field', async () => {
    renderDialog()
    expect(screen.queryByTestId('confirmationCode')).toBeNull()
    fireEvent.press(screen.getByTestId('sendEmailButton'))
    expect(await screen.findByTestId('confirmationCode')).toBeTruthy()
    expect(mockCall).toHaveBeenCalledTimes(1)
    expect(mockCall).toHaveBeenCalledWith(com.atproto.server.requestEmailUpdate)
  })

  it('reveals the code field without requesting an email via "I have a code"', () => {
    renderDialog()
    enterCodeStage()
    expect(getInput()).toBeTruthy()
    expect(getInput().props.autoFocus).toBe(true)
    expect(mockCall).not.toHaveBeenCalled()
  })

  it('normalizes the code and submits it via the confirm button', async () => {
    const control = renderDialog()
    enterCodeStage()
    fireEvent.changeText(getInput(), 'abcde23456')
    expect(getInput().props.value).toBe('ABCDE-23456')

    await act(async () => {
      fireEvent.press(screen.getByTestId('confirmBtn'))
      await Promise.resolve()
    })
    expect(mockCall).toHaveBeenCalledWith(com.atproto.server.updateEmail, {
      email: 'alice@example.com',
      token: 'ABCDE-23456',
      emailAuthFactor: false,
    })
    expect(mockRefreshSession).toHaveBeenCalledTimes(1)
    expect(mockToastShow).toHaveBeenCalledWith('Email 2FA disabled')
    expect(control.close).toHaveBeenCalledTimes(1)
  })

  it('submits the normalized token via keyboard submission', async () => {
    renderDialog()
    enterCodeStage()
    fireEvent.changeText(getInput(), 'abcde23456')

    await act(async () => {
      fireEvent(getInput(), 'submitEditing')
      await Promise.resolve()
    })
    expect(mockCall).toHaveBeenCalledWith(com.atproto.server.updateEmail, {
      email: 'alice@example.com',
      token: 'ABCDE-23456',
      emailAuthFactor: false,
    })
  })

  it('disables the input while processing, then refreshes, toasts, and closes', async () => {
    let resolveUpdate!: (value: unknown) => void
    mockCall.mockImplementation(
      () => new Promise(resolve => (resolveUpdate = resolve)),
    )
    const control = renderDialog()
    enterCodeStage()
    fireEvent.changeText(getInput(), 'abcde23456')
    expect(getInput().props.editable).toBe(true)

    await act(async () => {
      fireEvent.press(screen.getByTestId('confirmBtn'))
      await Promise.resolve()
    })
    expect(getInput().props.editable).toBe(false)
    expect(mockRefreshSession).not.toHaveBeenCalled()
    expect(control.close).not.toHaveBeenCalled()

    await act(async () => {
      resolveUpdate({})
      await Promise.resolve()
    })
    expect(mockRefreshSession).toHaveBeenCalledTimes(1)
    expect(mockToastShow).toHaveBeenCalledWith('Email 2FA disabled')
    expect(control.close).toHaveBeenCalledTimes(1)
    expect(getInput().props.editable).toBe(true)
  })
})
