import {useCallback, useEffect, useRef, useState} from 'react'
import {Alert, AppState, type AppStateStatus} from 'react-native'
import {nativeBuildVersion} from 'expo-application'
import {
  checkForUpdateAsync,
  fetchUpdateAsync,
  isEnabled,
  reloadAsync,
  setExtraParamAsync,
  setUpdateURLAndRequestHeadersOverride,
  useUpdates,
} from 'expo-updates'

import {isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {IS_ANDROID, IS_INTERNAL, IS_IOS, IS_TESTFLIGHT} from '#/env'

// Pull-request OTA previews are only available on internal (dev/TestFlight)
// builds. expo-open-ota selects the channel from the `expo-channel-name`
// request header, so retargeting an already-installed build to a
// `pull-request-<n>` channel at runtime requires
// `Updates.setUpdateURLAndRequestHeadersOverride`, which in turn requires
// `updates.disableAntiBrickingMeasures: true` in app.config.js. That flag
// weakens the embedded-update brick-recovery safety net, so it is baked into
// non-production builds only (`disableAntiBrickingMeasures: !IS_PRODUCTION`).
// Calling the override on a production build throws ERR_UPDATES_RUNTIME_OVERRIDE,
// hence the IS_INTERNAL gate here.
const PR_OTA_PREVIEWS_ENABLED = IS_INTERNAL

// The self-hosted expo-open-ota manifest endpoint (mirrors app.config.js
// `updates.url`). The runtime override points here with a per-PR channel header.
const UPDATES_MANIFEST_URL = 'https://updates.blacksky.community/manifest'

const MINIMUM_MINIMIZE_TIME = 15 * 60e3

async function setExtraParams() {
  // Channel is now carried by the baked-in `expo-channel-name` request header
  // (see app.config.js `updates.requestHeaders`). expo-open-ota resolves the
  // channel from that header, so we no longer set it as an extra param.
  await setExtraParamAsync(
    IS_IOS ? 'ios-build-number' : 'android-build-number',
    // Hilariously, `buildVersion` is not actually a string on Android even though the TS type says it is.
    // This just ensures it gets passed as a string
    `${nativeBuildVersion}`,
  )
}

async function updateTestflight() {
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
            await reloadAsync()
          },
        },
      ],
    )
  }
}

export function useApplyPullRequestOTAUpdate() {
  const {currentlyRunning} = useUpdates()
  const [pending, setPending] = useState(false)
  const currentChannel = currentlyRunning?.channel
  const isCurrentlyRunningPullRequestDeployment =
    currentChannel?.startsWith('pull-request')

  const tryApplyUpdate = async (channel: string) => {
    // Only available on non-production builds (see PR_OTA_PREVIEWS_ENABLED).
    // On production, disableAntiBrickingMeasures is off and the override below
    // would throw ERR_UPDATES_RUNTIME_OVERRIDE.
    if (!PR_OTA_PREVIEWS_ENABLED) {
      Alert.alert(
        'Unavailable',
        'Pull-request OTA previews are only available on TestFlight and development builds.',
      )
      return
    }

    setPending(true)
    try {
      // Retarget this install at the PR channel by overriding the manifest
      // request headers. expo-open-ota resolves the branch from
      // `expo-channel-name`, so this points the client at the PR bundle.
      setUpdateURLAndRequestHeadersOverride({
        updateUrl: UPDATES_MANIFEST_URL,
        requestHeaders: {'expo-channel-name': channel},
      })
      await setExtraParams()

      const res = await checkForUpdateAsync()
      if (res.isAvailable) {
        Alert.alert(
          'Deployment Available',
          `A deployment of ${channel} is available. Applying it may result in a bricked installation, in which case you will need to reinstall the app and may lose local data. Proceed?`,
          [
            {
              text: 'No',
              style: 'cancel',
              // User declined - drop the override so the next launch stays on
              // the embedded/build channel rather than the PR channel.
              onPress: () => setUpdateURLAndRequestHeadersOverride(null),
            },
            {
              text: 'Relaunch',
              style: 'default',
              onPress: async () => {
                await fetchUpdateAsync()
                await reloadAsync()
              },
            },
          ],
        )
      } else {
        setUpdateURLAndRequestHeadersOverride(null)
        Alert.alert(
          'No Deployment Available',
          `No new deployments of ${channel} are currently available for your current native build.`,
        )
      }
    } catch (e: any) {
      setUpdateURLAndRequestHeadersOverride(null)
      logger.error('PR OTA Update Error', {error: `${e}`})
      Alert.alert('Error', `Could not apply ${channel}: ${e}`)
    } finally {
      setPending(false)
    }
  }

  const revertToEmbedded = async () => {
    try {
      // Clear any PR channel override so we fall back to the baked-in channel.
      setUpdateURLAndRequestHeadersOverride(null)
      await updateTestflight()
    } catch (e: any) {
      logger.error('Internal OTA Update Error', {error: `${e}`})
    }
  }

  return {
    tryApplyUpdate,
    revertToEmbedded,
    isCurrentlyRunningPullRequestDeployment,
    currentChannel,
    pending,
  }
}

export function useOTAUpdates() {
  const shouldReceiveUpdates = isEnabled && !__DEV__

  const appState = useRef<AppStateStatus>('active')
  const lastMinimize = useRef(0)
  const ranInitialCheck = useRef(false)
  const timeout = useRef<NodeJS.Timeout>(undefined)
  const {currentlyRunning, isUpdatePending} = useUpdates()
  const currentChannel = currentlyRunning?.channel

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
      await updateTestflight()
    } catch (err: any) {
      if (!isNetworkError(err)) {
        logger.error('Internal OTA Update Error', {safeMessage: err})
      }
    }
  }, [])

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

    // TEMP: disable wake-from-background OTA loading on Android.
    // This is causing a crash when the thread view is open due to
    // `maintainVisibleContentPosition`. See repro repo for more details:
    // https://github.com/mozzius/ota-crash-repro
    // Old Arch only - re-enable once we're on the New Archictecture! -sfn
    if (IS_ANDROID) return

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
              await reloadAsync()
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
  }, [isUpdatePending, currentChannel, setCheckTimeout])
}
