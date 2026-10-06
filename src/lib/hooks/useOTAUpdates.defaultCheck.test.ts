import type * as ReactNative from 'react-native'
import type * as ExpoUpdates from 'expo-updates'
import type * as TestingLibrary from '@testing-library/react-native/pure'

import type * as OTAUpdatesModule from './useOTAUpdates'

jest.mock('expo-updates', () => ({
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  isEnabled: true,
  reloadAsync: jest.fn(),
  setExtraParamAsync: jest.fn(),
  UpdateCheckResultNotAvailableReason: {},
  useUpdates: jest.fn(),
}))

let mockLaunchURL: string | null = null
jest.mock('expo-linking', () => ({
  getLinkingURL: () => mockLaunchURL,
}))

// TestFlight checks on launch, without the timeout production builds wait for.
jest.mock('#/env', () => ({
  ...jest.requireActual('#/env'),
  IS_TESTFLIGHT: true,
}))

jest.mock('#/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('#/storage', () => ({
  device: {
    get: jest.fn(),
    remove: jest.fn(),
    set: jest.fn(),
  },
}))

jest.mock('#/alf', () => ({
  useTheme: () => ({scheme: 'light'}),
}))

let cleanup: (() => void) | undefined

/**
 * Loads the module fresh, as a cold launch from `launchURL` would, along with a
 * hook renderer from the same React instance.
 */
function load(launchURL: string | null) {
  mockLaunchURL = launchURL
  const rtl =
    require('@testing-library/react-native/pure') as typeof TestingLibrary
  cleanup = rtl.cleanup
  const {Alert} = require('react-native') as typeof ReactNative
  jest.spyOn(Alert, 'alert').mockImplementation(() => {})
  const updates = jest.mocked(require('expo-updates') as typeof ExpoUpdates)
  updates.useUpdates.mockReturnValue({
    currentlyRunning: {channel: 'testflight', isEmbeddedLaunch: true},
  } as ReturnType<typeof ExpoUpdates.useUpdates>)
  updates.setExtraParamAsync.mockResolvedValue(undefined)
  updates.checkForUpdateAsync.mockResolvedValue({
    isAvailable: false,
  } as Awaited<ReturnType<typeof ExpoUpdates.checkForUpdateAsync>>)
  return {
    ...(require('./useOTAUpdates') as typeof OTAUpdatesModule),
    ...rtl,
    updates,
  }
}

beforeEach(() => {
  jest.resetModules()
})

afterEach(() => {
  cleanup?.()
  cleanup = undefined
  jest.restoreAllMocks()
})

describe('useOTAUpdates', () => {
  it('checks the build channel on launch', async () => {
    const {useOTAUpdates, renderHook, waitFor, updates} = load(null)

    renderHook(() => useOTAUpdates())

    await waitFor(() => expect(updates.checkForUpdateAsync).toHaveBeenCalled())
    expect(updates.setExtraParamAsync).toHaveBeenCalledWith(
      'channel',
      'testflight',
    )
  })

  it('skips the launch check when launched to apply a deployment', () => {
    const {useOTAUpdates, renderHook, updates} = load(
      'bluesky://intent/apply-ota?channel=pull-request-123',
    )

    renderHook(() => useOTAUpdates())

    expect(updates.setExtraParamAsync).not.toHaveBeenCalled()
    expect(updates.checkForUpdateAsync).not.toHaveBeenCalled()
  })

  it('skips the launch check once a deployment has been requested', async () => {
    const {
      useApplyPullRequestOTAUpdate,
      useOTAUpdates,
      renderHook,
      act,
      updates,
    } = load(null)
    const {result} = renderHook(() => useApplyPullRequestOTAUpdate())
    await act(() => result.current.tryApplyUpdate('pull-request-123'))
    updates.setExtraParamAsync.mockClear()

    renderHook(() => useOTAUpdates())

    expect(updates.setExtraParamAsync).not.toHaveBeenCalled()
  })
})
