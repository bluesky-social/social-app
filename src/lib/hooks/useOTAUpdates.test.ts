import {Alert} from 'react-native'
import {
  checkForUpdateAsync,
  fetchUpdateAsync,
  reloadAsync,
  setExtraParamAsync,
  useUpdates,
} from 'expo-updates'
import {act, renderHook, waitFor} from '@testing-library/react-native'

import {logger} from '#/logger'
import {device} from '#/storage'
import {
  useApplyPullRequestOTAUpdate,
  useOTAUpdateRecovery,
} from './useOTAUpdates'

jest.mock('expo-updates', () => ({
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  isEnabled: true,
  reloadAsync: jest.fn(),
  setExtraParamAsync: jest.fn(),
  UpdateCheckResultNotAvailableReason: {
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

const currentUpdate = {
  channel: 'testflight',
  emergencyLaunchReason: null,
  isEmbeddedLaunch: false,
  isEmergencyLaunch: false,
  updateId: 'current-update',
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(useUpdates).mockReturnValue({
    currentlyRunning: currentUpdate,
  } as ReturnType<typeof useUpdates>)
  jest.mocked(setExtraParamAsync).mockResolvedValue(undefined)
  jest.mocked(reloadAsync).mockResolvedValue(undefined)
  jest.spyOn(Alert, 'alert').mockImplementation(() => {})
})

describe('useApplyPullRequestOTAUpdate', () => {
  it('warns before applying an OTA built for a different app version', async () => {
    jest.mocked(checkForUpdateAsync).mockResolvedValue({
      isAvailable: true,
    } as Awaited<ReturnType<typeof checkForUpdateAsync>>)
    jest.mocked(fetchUpdateAsync).mockResolvedValue({
      isNew: true,
      isRollBackToEmbedded: false,
      manifest: {id: 'mismatched-update'},
    } as Awaited<ReturnType<typeof fetchUpdateAsync>>)
    const {result} = renderHook(() => useApplyPullRequestOTAUpdate())

    await act(() => result.current.tryApplyUpdate('pull-request-123', '0.0.0'))

    expect(checkForUpdateAsync).not.toHaveBeenCalled()
    expect(Alert.alert).toHaveBeenCalledWith(
      'App Version Mismatch',
      expect.stringContaining('Applying it anyway may cause'),
      expect.arrayContaining([expect.objectContaining({text: 'Apply Anyway'})]),
    )

    const buttons = jest.mocked(Alert.alert).mock.calls[0][2]
    act(() => buttons?.[1].onPress?.())

    await waitFor(() => expect(reloadAsync).toHaveBeenCalled())
    expect(device.set).toHaveBeenCalledWith(['pendingOTAUpdate'], {
      attemptedAt: expect.any(Number),
      channel: 'pull-request-123',
      updateId: 'mismatched-update',
    })
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

    act(() => buttons?.[1].onPress?.())

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

    act(() => buttons?.[1].onPress?.())

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
    expect(result.current.pending).toBe(false)
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

  it('silently clears the marker when the attempted OTA launched', () => {
    jest.mocked(device.get).mockReturnValue({
      attemptedAt: Date.now(),
      channel: 'pull-request-123',
      updateId: currentUpdate.updateId,
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
