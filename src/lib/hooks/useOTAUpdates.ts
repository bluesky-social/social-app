import {useCallback, useEffect, useRef, useState} from 'react'
import {
  Alert,
  AppState,
  type AppStateStatus,
  Image as RNImage,
} from 'react-native'
import {nativeBuildVersion} from 'expo-application'
import {
  checkForUpdateAsync,
  type CurrentlyRunningInfo,
  fetchUpdateAsync,
  isEnabled,
  reloadAsync,
  type ReloadScreenOptions,
  setExtraParamAsync,
  UpdateCheckResultNotAvailableReason,
  useUpdates,
} from 'expo-updates'

import {isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useTheme} from '#/alf'
import {APP_VERSION, IS_IOS, IS_TESTFLIGHT} from '#/env'
import {device} from '#/storage'

const MINIMUM_MINIMIZE_TIME = 15 * 60e3
const OTA_RECOVERY_WINDOW = 5 * 60e3

/**
 * The channel this native build is expected to receive updates from. Anything
 * else is only reachable through the dev tooling in settings.
 */
const DEFAULT_CHANNEL = IS_TESTFLIGHT ? 'testflight' : 'production'

/**
 * Channels that our native builds are configured with, see `eas.json`. An
 * update running on any other channel was applied manually.
 */
const STANDARD_CHANNELS = ['production', 'testflight', 'development']

function getDeploymentName(channel: string) {
  const pullRequestNumber = channel.match(/^pull-request-(\d+)$/)?.[1]
  return pullRequestNumber ? `PR #${pullRequestNumber}` : channel
}

/**
 * The channel of the update bundle that is actually running. The
 * `currentlyRunning.channel` constant only reflects the channel baked into the
 * native build config, so a manually applied deployment (e.g. a pull request
 * channel) must be detected from the manifest metadata our update server stamps
 * into every published update. Embedded launches have no server manifest and
 * fall back to the build constant.
 */
function getRunningChannel(
  currentlyRunning: CurrentlyRunningInfo | undefined,
): string | undefined {
  /*
   * `metadata` is typed as a bare `object` by expo-manifests, and is absent
   * entirely from embedded manifests, so narrow it ourselves.
   */
  const manifest = currentlyRunning?.manifest as
    {metadata?: {channel?: unknown}} | undefined
  const channel = manifest?.metadata?.channel
  if (typeof channel === 'string' && channel) {
    return channel
  }
  // The build constant is an empty string rather than null when unconfigured.
  return currentlyRunning?.channel || undefined
}

async function setExtraParams() {
  await setExtraParamAsync(
    IS_IOS ? 'ios-build-number' : 'android-build-number',
    // Hilariously, `buildVersion` is not actually a string on Android even though the TS type says it is.
    // This just ensures it gets passed as a string
    `${nativeBuildVersion}`,
  )
  await setExtraParamAsync('channel', DEFAULT_CHANNEL)
}

async function setExtraParamsPullRequest(channel: string) {
  await setExtraParamAsync(
    IS_IOS ? 'ios-build-number' : 'android-build-number',
    // Hilariously, `buildVersion` is not actually a string on Android even though the TS type says it is.
    // This just ensures it gets passed as a string
    `${nativeBuildVersion}`,
  )
  await setExtraParamAsync('channel', channel)
}

async function updateTestflight(scheme: 'light' | 'dark') {
  await setExtraParams()

  const res = await checkForUpdateAsync()
  if (res.isAvailable) {
    await fetchUpdateAsync()
    Alert.alert(
      'Update Available',
      'A new version of the app is available. Relaunch now?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Relaunch',
          style: 'default',
          onPress: async () => {
            await reloadAsync({
              reloadScreenOptions: splash(scheme),
            })
          },
        },
      ],
    )
  }
}

export function useApplyPullRequestOTAUpdate() {
  const t = useTheme()
  const {currentlyRunning} = useUpdates()
  const [pending, setPending] = useState(false)
  const currentChannel = getRunningChannel(currentlyRunning)
  const isCurrentlyRunningPullRequestDeployment =
    currentChannel?.startsWith('pull-request')
  /*
   * Covers pull request deployments as well as any other channel we manually
   * applied an update from. Note that the channel is undefined when updates are
   * disabled (e.g. in dev), in which case there's nothing to restore.
   */
  const isCurrentlyRunningNonStandardChannel = Boolean(
    currentChannel && !STANDARD_CHANNELS.includes(currentChannel),
  )

  const tryApplyUpdate = async (
    channel: string,
    declaredAppVersion?: string | null,
  ) => {
    const deploymentName = getDeploymentName(channel)

    const checkForDeployment = async () => {
      await setExtraParamsPullRequest(channel)
      const res = await checkForUpdateAsync()
      if (!res.isAvailable) {
        if (
          res.reason ===
          UpdateCheckResultNotAvailableReason.UPDATE_PREVIOUSLY_FAILED
        ) {
          Alert.alert(
            'Deployment Blocked',
            `The ${deploymentName} deployment previously failed to start on this device, so the app will not try to apply it again.`,
          )
        } else if (currentChannel !== channel) {
          Alert.alert(
            'No Deployment Available',
            `No new deployments of ${channel} are currently available for your current native build.`,
          )
        }
      }
      return res.isAvailable
    }

    const applyUpdate = () => {
      setPending(true)
      void (async () => {
        try {
          if (!(await checkForDeployment())) return
          const fetchedUpdate = await fetchUpdateAsync()
          if (!fetchedUpdate.isNew) {
            throw new Error('Expo did not download a new update.')
          }

          device.set(['pendingOTAUpdate'], {
            attemptedAt: Date.now(),
            channel,
            updateId: fetchedUpdate.manifest.id,
          })
          try {
            /*
             * TODO: once expo-linking is upgraded to >= 57, enable this so the
             * re-delivered initial URL doesn't trigger a redundant silent check
             * after the reload.
             */
            // Linking.clearInitialURL()
            await reloadAsync({
              reloadScreenOptions: splash(t.scheme),
            })
          } catch (e) {
            device.remove(['pendingOTAUpdate'])
            throw e
          }
        } catch (e: unknown) {
          const error = String(e)
          logger.error('Internal OTA Update Error', {error})
          Alert.alert(
            'Update Failed',
            `Could not apply the ${deploymentName} deployment: ${error}`,
          )
        } finally {
          setPending(false)
        }
      })()
    }

    /*
     * Check before prompting about anything, so that re-running this while
     * already on the newest update of `channel` stays silent. Reloading into an
     * update re-delivers the deep link that triggered it, and the same link may
     * also just be tapped again.
     */
    setPending(true)
    try {
      if (!(await checkForDeployment())) return

      if (declaredAppVersion && declaredAppVersion !== APP_VERSION) {
        Alert.alert(
          'App Version Mismatch',
          `This OTA update was built for a different version of the app.\n\nCurrent app version: ${APP_VERSION}\nOTA app version: ${declaredAppVersion}\n\nApplying it anyway may cause the app to stop working and require a reinstall.`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Apply Anyway',
              style: 'destructive',
              onPress: applyUpdate,
            },
          ],
        )
        return
      }

      Alert.alert(
        `Apply update from ${deploymentName}?`,
        'The app will relaunch after the update is applied.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Apply',
            style: 'default',
            onPress: applyUpdate,
          },
        ],
      )
    } catch (e: unknown) {
      const error = String(e)
      logger.error('Internal OTA Update Error', {error})
      Alert.alert(
        'Update Check Failed',
        `Could not check the ${deploymentName} deployment: ${error}`,
      )
    } finally {
      setPending(false)
    }
  }

  /**
   * Pulls the newest update from the channel this build ships with and relaunches
   * into it, undoing a manually applied deployment.
   */
  const restoreDefaultChannel = async () => {
    setPending(true)
    try {
      await setExtraParams()
      const res = await checkForUpdateAsync()
      if (res.isAvailable) {
        await fetchUpdateAsync()
        await reloadAsync()
      } else {
        Alert.alert(
          'Nothing to Restore',
          `No deployment of ${DEFAULT_CHANNEL} is currently available for your native build. Reinstall the app to get back to a standard build.`,
        )
      }
    } catch (e: any) {
      logger.error('Internal OTA Update Error', {error: `${e}`})
      Alert.alert(
        'Restore Failed',
        `Could not restore the ${DEFAULT_CHANNEL} deployment: ${e}`,
      )
    } finally {
      setPending(false)
    }
  }

  return {
    tryApplyUpdate,
    restoreDefaultChannel,
    isCurrentlyRunningPullRequestDeployment,
    isCurrentlyRunningNonStandardChannel,
    currentChannel,
    defaultChannel: DEFAULT_CHANNEL,
    pending,
  }
}

/**
 * Reports when expo-updates recovered from a custom OTA that failed to launch.
 * The attempted update ID is persisted before reload so the previous bundle can
 * distinguish a successful relaunch from an automatic fallback.
 */
export function useOTAUpdateRecovery() {
  const {currentlyRunning} = useUpdates()

  useEffect(() => {
    const pendingUpdate = device.get(['pendingOTAUpdate'])
    if (!pendingUpdate || !currentlyRunning) return

    device.remove(['pendingOTAUpdate'])
    if (
      pendingUpdate.updateId.toLowerCase() ===
      currentlyRunning.updateId?.toLowerCase()
    ) {
      return
    }

    // A fallback relaunch is immediate. A stale marker can be left by a
    // successful runtime-compatible bundle that predates this hook.
    if (
      typeof pendingUpdate.attemptedAt !== 'number' ||
      Date.now() - pendingUpdate.attemptedAt >= OTA_RECOVERY_WINDOW
    ) {
      return
    }

    const deploymentName = getDeploymentName(pendingUpdate.channel)
    logger.error('Custom OTA Update Failed to Launch', {
      channel: pendingUpdate.channel,
      attemptedUpdateId: pendingUpdate.updateId,
      currentUpdateId: currentlyRunning.updateId,
      isEmergencyLaunch: currentlyRunning.isEmergencyLaunch,
      emergencyLaunchReason: currentlyRunning.emergencyLaunchReason,
    })
    Alert.alert(
      'Update Failed',
      `The ${deploymentName} deployment could not start. The app recovered by loading a working version instead.`,
    )
  }, [currentlyRunning])
}

export function useOTAUpdates() {
  const shouldReceiveUpdates = isEnabled && !__DEV__

  const t = useTheme()
  const appState = useRef<AppStateStatus>('active')
  const lastMinimize = useRef(0)
  const ranInitialCheck = useRef(false)
  const timeout = useRef<NodeJS.Timeout>(undefined)
  const {currentlyRunning, isUpdatePending} = useUpdates()
  const currentChannel = getRunningChannel(currentlyRunning)

  const setCheckTimeout = useCallback(() => {
    timeout.current = setTimeout(async () => {
      try {
        await setExtraParams()

        logger.debug('Checking for update...')
        const res = await checkForUpdateAsync()

        if (res.isAvailable) {
          logger.debug('Attempting to fetch update...')
          await fetchUpdateAsync()
        } else {
          logger.debug('No update available.')
        }
      } catch (err) {
        if (!isNetworkError(err)) {
          logger.error('OTA Update Error', {safeMessage: err})
        }
      }
    }, 10e3)
  }, [])

  const onIsTestFlight = useCallback(async () => {
    try {
      await updateTestflight(t.scheme)
    } catch (err: any) {
      if (!isNetworkError(err)) {
        logger.error('Internal OTA Update Error', {safeMessage: err})
      }
    }
  }, [t.scheme])

  useEffect(() => {
    // We don't need to check anything if the current update is a PR update
    if (currentChannel?.startsWith('pull-request')) {
      return
    }

    // We use this setTimeout to allow analytics to initialize before we check for an update
    // For Testflight users, we can prompt the user to update immediately whenever there's an available update. This
    // is suspect however with the Apple App Store guidelines, so we don't want to prompt production users to update
    // immediately.
    if (IS_TESTFLIGHT) {
      onIsTestFlight()
      return
    } else if (!shouldReceiveUpdates || ranInitialCheck.current) {
      return
    }

    setCheckTimeout()
    ranInitialCheck.current = true
  }, [onIsTestFlight, currentChannel, setCheckTimeout, shouldReceiveUpdates])

  // After the app has been minimized for 15 minutes, we want to either A. install an update if one has become available
  // or B check for an update again.
  useEffect(() => {
    // We also don't start this timeout if the user is on a pull request update
    if (!isEnabled || currentChannel?.startsWith('pull-request')) {
      return
    }

    const subscription = AppState.addEventListener(
      'change',
      async nextAppState => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          // If it's been 15 minutes since the last "minimize", we should feel comfortable updating the client since
          // chances are that there isn't anything important going on in the current session.
          if (lastMinimize.current <= Date.now() - MINIMUM_MINIMIZE_TIME) {
            if (isUpdatePending) {
              await reloadAsync({
                reloadScreenOptions: splash(t.scheme),
              })
            } else {
              setCheckTimeout()
            }
          }
        } else {
          lastMinimize.current = Date.now()
        }

        appState.current = nextAppState
      },
    )

    return () => {
      clearTimeout(timeout.current)
      subscription.remove()
    }
  }, [isUpdatePending, currentChannel, setCheckTimeout, t.scheme])
}

/**
 * Splash screen for while the app is updating
 */
export const splash = (scheme: 'light' | 'dark') => {
  const source =
    scheme === 'light'
      ? require('../../../assets/splash/splash.png')
      : require('../../../assets/splash/splash-dark.png')

  return {
    image: RNImage.resolveAssetSource(source).uri,
    imageFullScreen: true,
    imageResizeMode: 'cover',
    backgroundColor: scheme === 'light' ? '#006AFF' : '#002861',
    spinner: {
      enabled: true,
      color: '#ffffff',
      size: 'large',
    },
  } satisfies ReloadScreenOptions
}
