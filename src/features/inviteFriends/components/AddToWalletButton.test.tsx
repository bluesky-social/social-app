import {type ComponentType, type ReactNode} from 'react'
import {Platform} from 'react-native'
import type * as RNWalletModule from '@premieroctet/react-native-wallet'
import {act, render, waitFor} from '@testing-library/react-native'

import {AddToWalletButton} from './AddToWalletButton'

jest.mock('@premieroctet/react-native-wallet', () => ({
  __esModule: true,
  canAddPasses: jest.fn(),
  addPass: jest.fn(),
  addPassWithSignedJwt: jest.fn(),
  RNWalletView: 'RNWalletView',
  ButtonStyle: {BLACK: 0, BLACK_OUTLINE: 1},
  ButtonType: {PRIMARY: 0, CONDENSED: 1},
}))

// Use a getter so IS_WEB can be toggled per-test without module isolation.
// Babel compiles named imports to property accesses on the module object,
// so each read of IS_WEB invokes the getter dynamically.
// The variable is prefixed with "mock" so Jest's factory scope-check allows it.
let mockIsWeb = false
jest.mock('#/env', () => ({
  get IS_WEB() {
    return mockIsWeb
  },
  IS_IOS: true,
  IS_ANDROID: false,
  IS_NATIVE: true,
}))

jest.mock('#/state/session', () => ({
  useAgent: () => ({session: {accessJwt: 'fake'}}),
}))

jest.mock('#/analytics', () => ({
  useAnalytics: () => ({metric: jest.fn()}),
}))

jest.mock('#/logger', () => ({
  logger: {error: jest.fn()},
}))

jest.mock('#/components/Toast', () => ({
  show: jest.fn(),
}))

// The Lingui macro compiles useLingui from '@lingui/react/macro' to '@lingui/react'
// at build time, so we mock the runtime module.
jest.mock('@lingui/react', () => {
  const mockT = (descriptor: unknown): string => {
    if (typeof descriptor === 'object' && descriptor !== null) {
      const d = descriptor as {message?: string; id?: string}
      return d.message ?? d.id ?? ''
    }
    return typeof descriptor === 'string' ? descriptor : ''
  }
  return {
    useLingui: () => ({_: mockT, i18n: {t: mockT, _: mockT}}),
    I18nProvider: ({children}: {children: ReactNode}) => children,
    Trans: ({message}: {message?: string}) => message ?? '',
    LinguiContext: {Provider: ({children}: {children: ReactNode}) => children},
  }
})

const RNWallet = require('@premieroctet/react-native-wallet') as jest.Mocked<
  typeof RNWalletModule
>

beforeEach(() => {
  jest.clearAllMocks()
  mockIsWeb = false
  ;(Platform as {OS: string}).OS = 'ios'
  RNWallet.canAddPasses.mockResolvedValue(true)
  RNWallet.addPass.mockResolvedValue(true)
  RNWallet.addPassWithSignedJwt.mockResolvedValue(true)
})

// Flush any lingering microtasks/state-updates so they don't leak into the
// next test and trigger act() warnings.
afterEach(async () => {
  await act(async () => {})
})

// Test 1: IS_WEB gate
test('renders null on web', async () => {
  mockIsWeb = true
  const {toJSON} = render(<AddToWalletButton handle="alice.bsky.social" />)
  // Flush effects - with IS_WEB=true the canAddPasses effect exits early,
  // so the flush is just a guard.
  await act(async () => {})
  expect(toJSON()).toBeNull()
})

// Test 2: canAddPasses gate
test('renders null when canAddPasses() resolves false', async () => {
  RNWallet.canAddPasses.mockResolvedValue(false)
  const {toJSON} = render(<AddToWalletButton handle="alice.bsky.social" />)
  await waitFor(() => expect(RNWallet.canAddPasses).toHaveBeenCalled())
  // Flush promise resolution so setCanAdd(false) runs inside act
  await act(async () => {})
  expect(toJSON()).toBeNull()
})

// Test 3: handle sentinel gate
test('renders null when handle is invalid', async () => {
  const {toJSON} = render(<AddToWalletButton handle="handle.invalid" />)
  // handle is invalid so canAddPasses is not called; flush anyway for safety
  await act(async () => {})
  expect(toJSON()).toBeNull()
})

// Test 4: empty handle gate
test('renders null when handle is empty', async () => {
  const {toJSON} = render(<AddToWalletButton handle="" />)
  await act(async () => {})
  expect(toJSON()).toBeNull()
})

// Test 5: iOS press flow
test('iOS: mints token then calls addPass with the returned URL', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () =>
      Promise.resolve({
        url: 'https://bsky.app/invite/pass.pkpass?theme=dusk&t=tok',
      }),
  })
  const {UNSAFE_getByType} = render(
    <AddToWalletButton handle="alice.bsky.social" />,
  )
  await waitFor(() =>
    UNSAFE_getByType('RNWalletView' as unknown as ComponentType),
  )
  const view = UNSAFE_getByType(
    'RNWalletView' as unknown as ComponentType,
  ) as unknown as {
    props: {onPress: () => Promise<void>}
  }
  const {onPress} = view.props
  await act(async () => {
    await onPress()
  })
  expect(global.fetch).toHaveBeenCalledWith(
    'https://bsky.app/invite/pass.url',
    expect.objectContaining({method: 'POST'}),
  )
  expect(RNWallet.addPass).toHaveBeenCalledWith(
    'https://bsky.app/invite/pass.pkpass?theme=dusk&t=tok',
  )
})

// Test 6: Android is gated out for iOS-only launch (Google Wallet backend not provisioned)
test('Android: renders null until Google Wallet backend is wired', () => {
  ;(Platform as {OS: string}).OS = 'android'
  const {toJSON} = render(<AddToWalletButton handle="bob.bsky.social" />)
  expect(toJSON()).toBeNull()
})

// Test 7: error path
test('addPass throws – error toast and logger.error are called', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () =>
      Promise.resolve({url: 'https://bsky.app/invite/pass.pkpass?t=tok'}),
  })
  RNWallet.addPass.mockRejectedValue(new Error('boom'))
  const Toast = require('#/components/Toast')
  const ToastSpy = jest.spyOn(Toast, 'show')
  const {logger} = require('#/logger')
  const loggerSpy = jest.spyOn(logger, 'error')
  const {UNSAFE_getByType} = render(
    <AddToWalletButton handle="alice.bsky.social" />,
  )
  await waitFor(() =>
    UNSAFE_getByType('RNWalletView' as unknown as ComponentType),
  )
  const view = UNSAFE_getByType(
    'RNWalletView' as unknown as ComponentType,
  ) as unknown as {
    props: {onPress: () => Promise<void>}
  }
  const {onPress} = view.props
  await act(async () => {
    await onPress()
  })
  await waitFor(() =>
    expect(ToastSpy).toHaveBeenCalledWith(
      'Could not add to wallet – please try again',
      {type: 'error'},
    ),
  )
  expect(loggerSpy).toHaveBeenCalledWith(
    'InviteWallet: addPass failed',
    expect.objectContaining({safeMessage: expect.any(Error)}),
  )
})
