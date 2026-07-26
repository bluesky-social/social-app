import {useCallback, useEffect, useRef, useState} from 'react'
import {Alert, AppState, type AppStateStatus} from 'react-native'
import {nativeBuildVersion} from 'expo-application'
import {
  checkForUpdateAsync,
  fetchUpdateAsync,
  isEnabled,
  reloadAsync,
  setExtraParamAsync,
  useUpdates,
} from 'expo-updates'

import {isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {IS_ANDROID, IS_IOS, IS_TESTFLIGHT} from '#/env'
import {device} from '#/storage'

const MINIMUM_MINIMIZE_TIME = 15 * 60e3

/*
 * A reload brings up a new JS runtime within a few seconds, so a marker older
 * than this was left behind by a reload that never happened and is ignored.
 */
const RELOAD_MARKER_MAX_AGE = 60e3

/**
 * Reload the app to launch a downloaded update. Always use this instead of
 * `reloadAsync` so that `consumeOTAReloadMarker` can tell that the next JS
 * runtime came from a reload.
 */
export async function reloadWithUpdate() {
  device.set(['otaReloadedAt'], Date.now())
  await reloadAsync()
}

/**
 * Whether this JS runtime was started by us reloading the app to apply an
 * update, rather than by the user opening the app.
 *
 * `reloadAsync` restarts the JS runtime but not the native process, and
 * `expo-linking` keeps handing out the URL the app was originally opened with
 * (its native registry outlives the runtime), so anything that acts on that URL
 * needs to know to sit out the first pass after a reload. Clears the marker, so
 * only the first caller within a runtime gets `true`.
 */
export function consumeOTAReloadMarker() {
  const reloadedAt = device.get(['otaReloadedAt'])
  if (reloadedAt === undefined) return false
  device.remove(['otaReloadedAt'])
  return Date.now() - reloadedAt < RELOAD_MARKER_MAX_AGE
}

/**
 * The pull request deployment channel the running update was served from, or
 * `undefined` if we're not running a pull request deployment.
 *
 * `useUpdates().currentlyRunning.channel` is the channel configured in the
 * native build (`production` or `testflight`), not the channel the running
 * update was served from - our updates service picks that up from the `channel`
 * extra param - so it can never name a pull request deployment. Instead we
 * compare the running update against the one `tryApplyUpdate` recorded.
 */
function getRunningPullRequestChannel(runningUpdateId: string | undefined) {
  const applied = device.get(['appliedOTADeployment'])
  if (!applied || !runningUpdateId) return undefined
  /*
   * expo-updates lowercases the running update id (iOS reports uppercase
   * UUIDs), while the manifest id we recorded is whatever the service sent.
   */
  if (applied.updateId.toLowerCase() !== runningUpdateId.toLowerCase()) {
    return undefined
  }
  return applied.channel
}

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
            await reloadWithUpdate()
          },
        },
      ],
    )
  }
}

export function useApplyPullRequestOTAUpdate() {
  const {currentlyRunning} = useUpdates()
  const [pending, setPending] = useState(false)
  const pullRequestChannel = getRunningPullRequestChannel(
    currentlyRunning?.updateId,
  )
  const isCurrentlyRunningPullRequestDeployment =
    pullRequestChannel !== undefined
  const currentChannel = pullRequestChannel ?? currentlyRunning?.channel

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
              const fetched = await fetchUpdateAsync()
              /*
               * Record what we're about to launch so we can recognize the
               * deployment as running once it comes up, see
               * `getRunningPullRequestChannel`.
               */
              if (fetched.isNew) {
                device.set(['appliedOTADeployment'], {
                  channel,
                  updateId: fetched.manifest.id,
                })
              }
              await reloadWithUpdate()
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
    /*
     * Drop the record before reverting: `updateTestflight` can only relaunch us
     * if a newer regular update happens to be available, and as long as we
     * consider a pull request deployment to be running the automatic checks stay
     * backed off - which would leave no way off the deployment at all.
     */
    device.remove(['appliedOTADeployment'])
    try {
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
  const isRunningPullRequestDeployment =
    getRunningPullRequestChannel(currentlyRunning?.updateId) !== undefined

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
    if (isRunningPullRequestDeployment) {
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
  }, [
    onIsTestFlight,
    isRunningPullRequestDeployment,
    setCheckTimeout,
    shouldReceiveUpdates,
  ])

  // After the app has been minimized for 15 minutes, we want to either A. install an update if one has become available
  // or B check for an update again.
  useEffect(() => {
    // We also don't start this timeout if the user is on a pull request update
    if (!isEnabled || isRunningPullRequestDeployment) {
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
              await reloadWithUpdate()
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
  }, [isUpdatePending, isRunningPullRequestDeployment, setCheckTimeout])
}
