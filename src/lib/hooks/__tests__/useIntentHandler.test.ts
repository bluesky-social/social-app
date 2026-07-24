import {act, renderHook} from '@testing-library/react-native'

import {useVerifyEmailIntent} from '../useIntentHandler'

const mockCloseAllActiveElements = jest.fn()
const mockCloseAllActiveElementsAndWait = jest.fn()
const mockOpen = jest.fn()
const mockRequestSwitchToAccount = jest.fn()
const mockSetActiveLanding = jest.fn()
const mockSetVerifyEmailState = jest.fn()

let mockHasSession = false

jest.mock('expo-linking', () => ({useLinkingURL: jest.fn()}))
jest.mock('expo-web-browser', () => ({dismissBrowser: jest.fn()}))
jest.mock('#/lib/hooks/useOpenComposer', () => ({
  useOpenComposer: () => ({openComposer: jest.fn()}),
}))
jest.mock('#/state/queries/join-links', () => ({
  usePrefetchJoinLinkPreviews: () => jest.fn(),
}))
jest.mock('#/state/session', () => ({
  useSession: () => ({hasSession: mockHasSession}),
}))
jest.mock('#/state/shell/landing', () => ({
  useSetActiveLanding: () => mockSetActiveLanding,
}))
jest.mock('#/state/shell/logged-out', () => ({
  useLoggedOutViewControls: () => ({
    requestSwitchToAccount: mockRequestSwitchToAccount,
  }),
}))
jest.mock('#/state/util', () => ({
  useCloseAllActiveElements: () => mockCloseAllActiveElements,
  useCloseAllActiveElementsAndWait: () => mockCloseAllActiveElementsAndWait,
}))
jest.mock('#/components/intents/IntentDialogs', () => ({
  useIntentDialogs: () => ({
    verifyEmailDialogControl: {open: mockOpen},
    setVerifyEmailState: mockSetVerifyEmailState,
  }),
}))
jest.mock('#/analytics', () => ({
  useAnalytics: () => ({metric: jest.fn()}),
}))
jest.mock('#/env', () => ({IS_IOS: false, IS_NATIVE: true}))
jest.mock('../../../../modules/expo-bluesky-swiss-army', () => ({
  Referrer: {getReferrerInfo: jest.fn()},
}))
jest.mock('../useOTAUpdates', () => ({
  useApplyPullRequestOTAUpdate: () => ({tryApplyUpdate: jest.fn()}),
}))

describe('useVerifyEmailIntent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCloseAllActiveElementsAndWait.mockResolvedValue(undefined)
    mockHasSession = false
  })

  it('keeps verification pending while the user signs in', () => {
    const {result} = renderHook(() => useVerifyEmailIntent())

    act(() => result.current('abcde-fghij'))

    expect(mockSetActiveLanding).toHaveBeenCalledWith({
      type: 'verify-email',
      code: 'abcde-fghij',
    })
    expect(mockRequestSwitchToAccount).toHaveBeenCalledWith({
      requestedAccount: 'none',
    })
    expect(mockSetVerifyEmailState).not.toHaveBeenCalled()
    expect(mockCloseAllActiveElementsAndWait).not.toHaveBeenCalled()
  })

  it('queues verification after active dialogs finish dismissing', async () => {
    let finishDismissal: (() => void) | undefined
    mockCloseAllActiveElementsAndWait.mockImplementation(
      () =>
        new Promise<void>(resolve => {
          finishDismissal = resolve
        }),
    )
    mockHasSession = true
    const {result} = renderHook(() => useVerifyEmailIntent())

    act(() => result.current('abcde-fghij'))

    expect(mockCloseAllActiveElementsAndWait).toHaveBeenCalledTimes(1)
    expect(mockSetVerifyEmailState).not.toHaveBeenCalled()

    await act(async () => {
      finishDismissal?.()
      await Promise.resolve()
    })

    /*
     * The hook only queues the code; VerifyEmailIntentDialog opens itself once
     * the code is set, so the hook does not call open().
     */
    expect(mockSetVerifyEmailState).toHaveBeenCalledWith({
      code: 'abcde-fghij',
    })
    expect(mockSetActiveLanding).not.toHaveBeenCalled()
    expect(mockOpen).not.toHaveBeenCalled()
  })
})
