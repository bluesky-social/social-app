import {useCallback, useEffect, useRef, useState} from 'react'
import {Alert, AppState, type AppStateStatus} from 'react-native'
import {nativeBuildVersion} from 'expo-application'
import {Asset} from 'expo-asset'
import {
  checkForUpdateAsync,
  fetchUpdateAsync,
  isEnabled,
  reloadAsync,
  type ReloadScreenOptions,
  setExtraParamAsync,
  useUpdates,
} from 'expo-updates'

import {isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useTheme} from '#/alf'
import {IS_ANDROID, IS_IOS, IS_TESTFLIGHT} from '#/env'

const MINIMUM_MINIMIZE_TIME = 15 * 60e3

async function setExtraParams() {
  await setExtraParamAsync(
    IS_IOS ? 'ios-build-number' : 'android-build-number',
    // Hilariously, `buildVersion` is not actually a string on Android even though the TS type says it is.
    // This just ensures it gets passed as a string
    `${nativeBuildVersion}`,
  )
  await setExtraParamAsync(
    'channel',
    IS_TESTFLIGHT ? 'testflight' : 'production',
  )
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
              reloadScreenOptions: await splash(scheme),
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
  const currentChannel = currentlyRunning?.channel
  const isCurrentlyRunningPullRequestDeployment =
    currentChannel?.startsWith('pull-request')

  const tryApplyUpdate = async (channel: string) => {
    setPending(true)
    await setExtraParamsPullRequest(channel)
    const res = await checkForUpdateAsync()
    if (res.isAvailable) {
      Alert.alert(
        'Deployment Available',
        `A deployment of ${channel} is availalble. Applying this deployment may result in a bricked installation, in which case you will need to reinstall the app and may lose local data. Are you sure you want to proceed?`,
        [
          {
            text: 'No',
            style: 'cancel',
          },
          {
            text: 'Relaunch',
            style: 'default',
            onPress: async () => {
              await fetchUpdateAsync()
              await reloadAsync({
                reloadScreenOptions: await splash(t.scheme),
              })
            },
          },
        ],
      )
    } else {
      Alert.alert(
        'No Deployment Available',
        `No new deployments of ${channel} are currently available for your current native build.`,
      )
    }
    setPending(false)
  }

  const revertToEmbedded = async () => {
    try {
      await updateTestflight(t.scheme)
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

  const t = useTheme()
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
              await reloadAsync({
                reloadScreenOptions: await splash(t.scheme),
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
export const splash = async (scheme: 'light' | 'dark') => {
  const source =
    scheme === 'light'
      ? require('../../../assets/splash/splash.png')
      : require('../../../assets/splash/splash-dark.png')
  let image: string | undefined

  try {
    const [asset] = await Asset.loadAsync([source])
    image = asset?.localUri ?? undefined
    if (!image) {
      logger.warn('Failed to materialize the OTA splash screen image')
    }
  } catch (err) {
    logger.warn('Failed to materialize the OTA splash screen image', {
      safeMessage: err,
    })
  }

  return {
    image,
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
