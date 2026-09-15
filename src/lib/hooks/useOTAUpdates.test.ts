import {Alert, AppState} from 'react-native'
import {
  checkForUpdateAsync,
  fetchUpdateAsync,
  reloadAsync,
  setExtraParamAsync,
  UpdateCheckResultNotAvailableReason,
  useUpdates,
} from 'expo-updates'
import {act, renderHook, waitFor} from '@testing-library/react-native'

import {logger} from '#/logger'
import {APP_VERSION} from '#/env'
import {device} from '#/storage'
import {
  checkForOTAUpdate,
  prepareOTAUpdateRequest,
  useApplyPullRequestOTAUpdate,
  useOTAUpdateRecovery,
  useOTAUpdates,
} from './useOTAUpdates'

let mockRuntimeVersion = '1.133.0'

jest.mock('expo-updates', () => ({
  channel: 'testflight',
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  isEnabled: true,
  reloadAsync: jest.fn(),
  get runtimeVersion() {
    return mockRuntimeVersion
  },
  setExtraParamAsync: jest.fn(),
  UpdateCheckResultNotAvailableReason: {
    NO_UPDATE_AVAILABLE_ON_SERVER: 'noUpdateAvailableOnServer',
    UPDATE_PREVIOUSLY_FAILED: 'updatePreviouslyFailed',
  },
  useUpdates: jest.fn(),
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
  useTheme: jest.fn().mockImplementation(() => ({
    scheme: 'light',
  })),
}))

/**
 * `channel` here is the build-time constant baked into the native build, not the
 * channel of the running bundle. `channel` is passed as the manifest metadata
 * channel our update server stamps into every published update - omit it to
 * simulate an embedded launch, which has no server manifest.
 */
function mockCurrentlyRunning({
  buildChannel = 'testflight',
  channel,
  updateId = 'current-update',
  isUpdatePending = false,
}: {
  buildChannel?: string
  channel?: string
  updateId?: string
  isUpdatePending?: boolean
} = {}) {
  const currentlyRunning = {
    channel: buildChannel,
    emergencyLaunchReason: null,
    isEmbeddedLaunch: !channel,
    isEmergencyLaunch: false,
    updateId,
    manifest: channel ? {id: updateId, metadata: {channel}} : undefined,
  }
  jest.mocked(useUpdates).mockReturnValue({
    currentlyRunning,
    isUpdatePending,
  } as ReturnType<typeof useUpdates>)
  return currentlyRunning
}

const currentUpdate = {updateId: 'current-update'}

beforeEach(() => {
  jest.clearAllMocks()
  mockRuntimeVersion = '1.133.0'
  mockCurrentlyRunning()
  jest.mocked(setExtraParamAsync).mockResolvedValue(undefined)
  jest.mocked(reloadAsync).mockResolvedValue(undefined)
  jest.spyOn(Alert, 'alert').mockImplementation(() => {})
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({status: 'available', deployments: []}),
  })
})

describe('useApplyPullRequestOTAUpdate', () => {
  it('rejects manually applying a non-PR channel', async () => {
    const {result} = renderHook(() => useApplyPullRequestOTAUpdate())

    await act(() => result.current.tryApplyUpdate('testflight'))

    expect(Alert.alert).toHaveBeenCalledWith(
      'Invalid Deployment',
      expect.stringContaining('Only pull request'),
    )
    expect(checkForUpdateAsync).not.toHaveBeenCalled()
  })

  it('detects a running PR deployment from the manifest metadata', () => {
    mockCurrentlyRunning({
      buildChannel: 'testflight',
      channel: 'pull-request-123',
    })

    const {result} = renderHook(() => useApplyPullRequestOTAUpdate())

    expect(result.current.currentChannel).toBe('pull-request-123')
    expect(result.current.isCurrentlyRunningPullRequestDeployment).toBe(true)
    expect(result.current.isCurrentlyRunningNonStandardChannel).toBe(true)
  })

  it('treats a standard downloaded update as a standard channel', () => {
    mockCurrentlyRunning({buildChannel: 'testflight', channel: 'testflight'})

    const {result} = renderHook(() => useApplyPullRequestOTAUpdate())

    expect(result.current.currentChannel).toBe('testflight')
    expect(result.current.isCurrentlyRunningPullRequestDeployment).toBe(false)
    expect(result.current.isCurrentlyRunningNonStandardChannel).toBe(false)
  })

  it('falls back to the build channel for an embedded launch', () => {
    mockCurrentlyRunning({buildChannel: 'testflight'})

    const {result} = renderHook(() => useApplyPullRequestOTAUpdate())

    expect(result.current.currentChannel).toBe('testflight')
    expect(result.current.isCurrentlyRunningNonStandardChannel).toBe(false)
  })

  it('reports no channel when updates are disabled', () => {
    mockCurrentlyRunning({buildChannel: ''})

    const {result} = renderHook(() => useApplyPullRequestOTAUpdate())

    expect(result.current.currentChannel).toBeUndefined()
    expect(result.current.isCurrentlyRunningNonStandardChannel).toBe(false)
  })

  it('stays quiet when already running the latest of the requested channel', async () => {
    mockCurrentlyRunning({
      buildChannel: 'testflight',
      channel: 'pull-request-123',
    })
    jest.mocked(checkForUpdateAsync).mockResolvedValue({
      isAvailable: false,
      reason: UpdateCheckResultNotAvailableReason.NO_UPDATE_AVAILABLE_ON_SERVER,
    } as Awaited<ReturnType<typeof checkForUpdateAsync>>)
    const {result} = renderHook(() => useApplyPullRequestOTAUpdate())

    await act(() => result.current.tryApplyUpdate('pull-request-123'))

    expect(Alert.alert).not.toHaveBeenCalled()
  })

  it('warns when no deployment is available for a different channel', async () => {
    mockCurrentlyRunning({
      buildChannel: 'testflight',
      channel: 'pull-request-123',
    })
    jest.mocked(checkForUpdateAsync).mockResolvedValue({
      isAvailable: false,
      reason: UpdateCheckResultNotAvailableReason.NO_UPDATE_AVAILABLE_ON_SERVER,
    } as Awaited<ReturnType<typeof checkForUpdateAsync>>)
    const {result} = renderHook(() => useApplyPullRequestOTAUpdate())

    await act(() => result.current.tryApplyUpdate('pull-request-456'))

    expect(Alert.alert).toHaveBeenCalledWith(
      'No Deployment Available',
      expect.stringContaining('pull-request-456'),
    )
  })

  it('stays silent on a re-fired intent even when the app version differs', async () => {
    mockCurrentlyRunning({
      buildChannel: 'testflight',
      channel: 'pull-request-123',
    })
    jest.mocked(checkForUpdateAsync).mockResolvedValue({
      isAvailable: false,
      reason: UpdateCheckResultNotAvailableReason.NO_UPDATE_AVAILABLE_ON_SERVER,
    } as Awaited<ReturnType<typeof checkForUpdateAsync>>)
    const {result} = renderHook(() => useApplyPullRequestOTAUpdate())

    await act(() => result.current.tryApplyUpdate('pull-request-123', '0.0.0'))

    expect(Alert.alert).not.toHaveBeenCalled()
    expect(fetchUpdateAsync).not.toHaveBeenCalled()
  })

  it('prompts to apply an available update when the app version matches', async () => {
    jest.mocked(checkForUpdateAsync).mockResolvedValue({
      isAvailable: true,
    } as Awaited<ReturnType<typeof checkForUpdateAsync>>)
    const {result} = renderHook(() => useApplyPullRequestOTAUpdate())

    await act(() =>
      result.current.tryApplyUpdate('pull-request-123', APP_VERSION),
    )

    expect(Alert.alert).toHaveBeenCalledWith(
      'Apply update from PR #123?',
      expect.stringContaining('relaunch'),
      expect.arrayContaining([expect.objectContaining({text: 'Apply'})]),
    )
  })

  it('warns before applying an OTA built for a different app version', async () => {
    jest.mocked(checkForUpdateAsync).mockResolvedValue({
      isAvailable: true,
    } as Awaited<ReturnType<typeof checkForUpdateAsync>>)
    jest.mocked(fetchUpdateAsync).mockResolvedValue({
      isNew: true,
      isRollBackToEmbedded: false,
      manifest: {id: 'mismatched-update'},
    } as unknown as Awaited<ReturnType<typeof fetchUpdateAsync>>)
    const {result} = renderHook(() => useApplyPullRequestOTAUpdate())

    await act(() => result.current.tryApplyUpdate('pull-request-123', '0.0.0'))

    expect(Alert.alert).toHaveBeenCalledWith(
      'App Version Mismatch',
      expect.stringContaining('Applying it anyway may cause'),
      expect.arrayContaining([expect.objectContaining({text: 'Apply Anyway'})]),
    )

    const buttons = jest.mocked(Alert.alert).mock.calls[0][2]
    void act(() => buttons?.[1].onPress?.())

    await waitFor(() => expect(reloadAsync).toHaveBeenCalled())
    expect(device.set).toHaveBeenCalledWith(['pendingOTAUpdate'], {
      attemptedAt: expect.any(Number),
      channel: 'pull-request-123',
      updateId: 'mismatched-update',
    })
  })

  it('does not offer an app-version override to fingerprint clients', async () => {
    mockRuntimeVersion = 'a'.repeat(40)
    jest.mocked(checkForUpdateAsync).mockResolvedValue({
      isAvailable: true,
    } as Awaited<ReturnType<typeof checkForUpdateAsync>>)
    const {result} = renderHook(() => useApplyPullRequestOTAUpdate())

    await act(() => result.current.tryApplyUpdate('pull-request-123', '0.0.0'))

    expect(Alert.alert).toHaveBeenCalledWith(
      'Apply update from PR #123?',
      expect.stringContaining('relaunch'),
      expect.arrayContaining([expect.objectContaining({text: 'Apply'})]),
    )
    expect(Alert.alert).not.toHaveBeenCalledWith(
      'App Version Mismatch',
      expect.anything(),
      expect.anything(),
    )
  })

  it.each([
    ['runtime-mismatch', 'Different Native Build Required'],
    ['not-published', 'No Deployment Available'],
    ['stale-link', 'Deployment Link Is Out of Date'],
  ] as const)('handles the %s diagnostic status', async (status, title) => {
    mockRuntimeVersion = 'a'.repeat(40)
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({status, deployments: []}),
    })
    const {result} = renderHook(() => useApplyPullRequestOTAUpdate())

    await act(() => result.current.tryApplyUpdate('pull-request-123'))

    expect(Alert.alert).toHaveBeenCalledWith(title, expect.any(String))
    expect(checkForUpdateAsync).not.toHaveBeenCalled()
  })

  it('stays quiet when diagnostics report the deployment already running', async () => {
    mockRuntimeVersion = 'a'.repeat(40)
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({status: 'already-running', deployments: []}),
    })
    const {result} = renderHook(() => useApplyPullRequestOTAUpdate())

    await act(() => result.current.tryApplyUpdate('pull-request-123'))

    expect(Alert.alert).not.toHaveBeenCalled()
    expect(checkForUpdateAsync).not.toHaveBeenCalled()
    expect(result.current.pending).toBe(false)
  })

  it('allows only one PR confirmation prompt at a time', async () => {
    jest.mocked(checkForUpdateAsync).mockResolvedValue({
      isAvailable: true,
    } as Awaited<ReturnType<typeof checkForUpdateAsync>>)
    const {result} = renderHook(() => useApplyPullRequestOTAUpdate())

    await act(() => result.current.tryApplyUpdate('pull-request-123'))
    await act(() => result.current.tryApplyUpdate('pull-request-456'))

    expect(Alert.alert).toHaveBeenCalledTimes(1)
    expect(result.current.pending).toBe(true)
  })

  it('rejects a fetched deployment whose source does not match the link', async () => {
    mockRuntimeVersion = 'a'.repeat(40)
    jest.mocked(checkForUpdateAsync).mockResolvedValue({
      isAvailable: true,
    } as Awaited<ReturnType<typeof checkForUpdateAsync>>)
    jest.mocked(fetchUpdateAsync).mockResolvedValue({
      isNew: true,
      isRollBackToEmbedded: false,
      manifest: {id: 'new-update', extra: {ota: {sourceCommit: 'newer'}}},
    } as unknown as Awaited<ReturnType<typeof fetchUpdateAsync>>)
    const {result} = renderHook(() => useApplyPullRequestOTAUpdate())

    await act(() =>
      result.current.tryApplyUpdate('pull-request-123', null, {
        sourceCommit: 'expected',
      }),
    )
    const buttons = jest.mocked(Alert.alert).mock.calls[0][2]
    void act(() => buttons?.[1].onPress?.())

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenLastCalledWith(
        'Update Failed',
        expect.stringContaining('deployment changed'),
      ),
    )
    expect(reloadAsync).not.toHaveBeenCalled()
    expect(setExtraParamAsync).toHaveBeenLastCalledWith('channel', 'testflight')
  })

  it('informs the user when checking for an OTA fails', async () => {
    jest.mocked(checkForUpdateAsync).mockRejectedValue(new Error('offline'))
    const {result} = renderHook(() => useApplyPullRequestOTAUpdate())

    await act(() => result.current.tryApplyUpdate('pull-request-123'))

    expect(Alert.alert).toHaveBeenCalledWith(
      'Update Check Failed',
      expect.stringContaining('Error: offline'),
    )
    expect(result.current.pending).toBe(false)
  })

  it('informs the user when downloading an OTA fails', async () => {
    jest.mocked(checkForUpdateAsync).mockResolvedValue({
      isAvailable: true,
    } as Awaited<ReturnType<typeof checkForUpdateAsync>>)
    jest
      .mocked(fetchUpdateAsync)
      .mockRejectedValue(new Error('download failed'))
    const {result} = renderHook(() => useApplyPullRequestOTAUpdate())

    await act(() => result.current.tryApplyUpdate('pull-request-123'))
    const buttons = jest.mocked(Alert.alert).mock.calls[0][2]

    void act(() => buttons?.[1].onPress?.())

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenLastCalledWith(
        'Update Failed',
        expect.stringContaining('Error: download failed'),
      ),
    )
    expect(device.set).not.toHaveBeenCalled()
    expect(result.current.pending).toBe(false)
  })

  it('clears the recovery marker and informs the user when reloading fails', async () => {
    jest.mocked(checkForUpdateAsync).mockResolvedValue({
      isAvailable: true,
    } as Awaited<ReturnType<typeof checkForUpdateAsync>>)
    jest.mocked(fetchUpdateAsync).mockResolvedValue({
      isNew: true,
      isRollBackToEmbedded: false,
      manifest: {id: 'new-update'},
    } as Awaited<ReturnType<typeof fetchUpdateAsync>>)
    jest.mocked(reloadAsync).mockRejectedValue(new Error('reload failed'))
    const {result} = renderHook(() => useApplyPullRequestOTAUpdate())

    await act(() => result.current.tryApplyUpdate('pull-request-123'))
    const buttons = jest.mocked(Alert.alert).mock.calls[0][2]

    void act(() => buttons?.[1].onPress?.())

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenLastCalledWith(
        'Update Failed',
        expect.stringContaining('Error: reload failed'),
      ),
    )
    expect(device.set).toHaveBeenCalledWith(['pendingOTAUpdate'], {
      attemptedAt: expect.any(Number),
      channel: 'pull-request-123',
      updateId: 'new-update',
    })
    expect(device.remove).toHaveBeenCalledWith(['pendingOTAUpdate'])
    expect(setExtraParamAsync).toHaveBeenLastCalledWith('channel', 'testflight')
    expect(result.current.pending).toBe(false)
  })

  it('restores the default request after cancellation', async () => {
    jest.mocked(checkForUpdateAsync).mockResolvedValue({
      isAvailable: true,
    } as Awaited<ReturnType<typeof checkForUpdateAsync>>)
    const {result} = renderHook(() => useApplyPullRequestOTAUpdate())

    await act(() => result.current.tryApplyUpdate('pull-request-123'))
    const buttons = jest.mocked(Alert.alert).mock.calls[0][2]
    await act(() => buttons?.[0].onPress?.())

    await waitFor(() =>
      expect(setExtraParamAsync).toHaveBeenLastCalledWith(
        'channel',
        'testflight',
      ),
    )
    expect(result.current.pending).toBe(false)
  })
})

describe('useOTAUpdates', () => {
  it('does not reload a pending default update while a PR prompt owns the request', async () => {
    let appStateListener: ((state: string) => Promise<void>) | undefined
    jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_, listener) => {
        appStateListener = listener as (state: string) => Promise<void>
        return {remove: jest.fn()}
      })
    jest.mocked(checkForUpdateAsync).mockResolvedValue({
      isAvailable: true,
    } as Awaited<ReturnType<typeof checkForUpdateAsync>>)
    mockCurrentlyRunning({isUpdatePending: true})
    const apply = renderHook(() => useApplyPullRequestOTAUpdate())
    renderHook(() => useOTAUpdates())

    await act(() => apply.result.current.tryApplyUpdate('pull-request-123'))
    jest
      .spyOn(Date, 'now')
      .mockReturnValueOnce(0)
      .mockReturnValue(16 * 60e3)
    await act(async () => {
      await appStateListener?.('background')
      await appStateListener?.('active')
    })

    expect(reloadAsync).not.toHaveBeenCalled()
  })
})

describe('OTA request preparation', () => {
  it('sets the native build number before the channel', async () => {
    await prepareOTAUpdateRequest('pull-request-123')

    expect(setExtraParamAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringMatching(/^(ios|android)-build-number$/),
      expect.any(String),
    )
    expect(setExtraParamAsync).toHaveBeenNthCalledWith(
      2,
      'channel',
      'pull-request-123',
    )
  })

  it('prepares the default channel before checking', async () => {
    jest.mocked(checkForUpdateAsync).mockResolvedValue({
      isAvailable: false,
      reason: UpdateCheckResultNotAvailableReason.NO_UPDATE_AVAILABLE_ON_SERVER,
    } as Awaited<ReturnType<typeof checkForUpdateAsync>>)

    await checkForOTAUpdate()

    expect(setExtraParamAsync).toHaveBeenLastCalledWith('channel', 'testflight')
    expect(checkForUpdateAsync).toHaveBeenCalledTimes(1)
  })
})

describe('useOTAUpdateRecovery', () => {
  it('informs the user when Expo fell back from the attempted OTA', async () => {
    jest.mocked(device.get).mockReturnValue({
      attemptedAt: Date.now(),
      channel: 'pull-request-123',
      updateId: 'failed-update',
    })

    renderHook(() => useOTAUpdateRecovery())

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        'Update Failed',
        expect.stringContaining('PR #123 deployment could not start'),
      ),
    )
    expect(device.remove).toHaveBeenCalledWith(['pendingOTAUpdate'])
    expect(logger.error).toHaveBeenCalledWith(
      'Custom OTA Update Failed to Launch',
      expect.objectContaining({attemptedUpdateId: 'failed-update'}),
    )
  })

  it('recognizes a launched OTA when the update ID casing differs', () => {
    jest.mocked(device.get).mockReturnValue({
      attemptedAt: Date.now(),
      channel: 'pull-request-123',
      updateId: currentUpdate.updateId.toUpperCase(),
    })

    renderHook(() => useOTAUpdateRecovery())

    expect(device.remove).toHaveBeenCalledWith(['pendingOTAUpdate'])
    expect(Alert.alert).not.toHaveBeenCalled()
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('silently clears a stale marker from an older OTA bundle', () => {
    jest.mocked(device.get).mockReturnValue({
      attemptedAt: Date.now() - 10 * 60e3,
      channel: 'pull-request-123',
      updateId: 'older-update',
    })

    renderHook(() => useOTAUpdateRecovery())

    expect(device.remove).toHaveBeenCalledWith(['pendingOTAUpdate'])
    expect(Alert.alert).not.toHaveBeenCalled()
    expect(logger.error).not.toHaveBeenCalled()
  })
})
