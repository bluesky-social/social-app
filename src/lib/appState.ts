import {useEffect, useEffectEvent, useState} from 'react'
import {AppState, type AppStateStatus} from 'react-native'

export const getCurrentState = () => AppState.currentState

export function onAppStateChange(cb: (state: AppStateStatus) => void) {
  let prev = AppState.currentState
  return AppState.addEventListener('change', next => {
    if (next === prev) return
    prev = next
    cb(next)
  })
}

export function useOnAppStateChange(cb: (state: AppStateStatus) => void) {
  useEffect(() => {
    const sub = onAppStateChange(next => cb(next))
    return () => sub.remove()
  }, [cb])
}

export function useAppState() {
  const [state, setState] = useState(AppState.currentState)
  useOnAppStateChange(setState)
  return state
}

/**
 * One return from the background. Every listener is handed the same object for
 * the same return.
 */
export type AppReturn = {
  /**
   * Starts at 1 and goes up by one per return for the life of the JS runtime.
   * Listeners that hear about the same return see the same id, so it can key
   * work triggered by that return, and it orders returns without relying on
   * the clock.
   */
  readonly id: number
  /**
   * `Date.now()` when the return was observed, for windows measured from the
   * return. Wall-clock, so it compares directly with other `Date.now()` stamps
   * (e.g. a query's `dataUpdatedAt`), but it can jump if the device clock
   * changes - order returns by `id`.
   */
  readonly timestamp: number
}

const returnListeners = new Set<(appReturn: AppReturn) => void>()
let isTrackingReturns = false
let lastReturnId = 0

/**
 * Starts the single app state listener that all return listeners share, so
 * that each return gets one id however many listeners hear it, and whether a
 * transition is a return doesn't depend on when a listener joined. It is never
 * removed: the latch and the counter describe the app rather than any one
 * listener, so they outlive listeners coming and going.
 */
function trackReturns() {
  if (isTrackingReturns) return
  isTrackingReturns = true

  let hasBeenBackgrounded = AppState.currentState === 'background'
  onAppStateChange(next => {
    if (next === 'background') {
      hasBeenBackgrounded = true
    } else if (next === 'active' && hasBeenBackgrounded) {
      hasBeenBackgrounded = false
      const appReturn: AppReturn = {id: ++lastReturnId, timestamp: Date.now()}
      for (const listener of [...returnListeners]) {
        // an earlier listener may have removed this one
        if (returnListeners.has(listener)) listener(appReturn)
      }
    }
  })
}

/**
 * Calls `cb` each time the app comes back after it was actually backgrounded:
 * the first `active` after a `background`. An `inactive -> active` interruption
 * with no `background` in between is not a return, and neither is the first
 * `active` of a foreground launch.
 *
 * `inactive` is ignored in both directions. The app passes through it on the
 * way out, and sits in it during interruptions that never take it away, so it
 * says nothing about whether a return is coming.
 *
 * What React Native 0.86 reports on each platform:
 *
 * - iOS (`React/CoreModules/RCTAppState.mm`) reports all three states. Leaving
 *   goes `active -> inactive -> background`. Coming back goes straight from
 *   `background` to `active`: RN reports
 *   `UIApplicationWillEnterForegroundNotification` as `background`, which
 *   repeats the last state and is not emitted. Temporary interruptions only
 *   reach `inactive` and go back to `active` (`applicationWillResignActive`:
 *   "temporary interruptions like an incoming phone call or SMS message"; RN's
 *   AppState docs add the multitasking view and Notification Center), as do
 *   Control Center and system alerts such as permission prompts, so none of
 *   them fire. A foreground launch goes `inactive -> active` ("After launch,
 *   the system puts the app in the inactive or background state, depending on
 *   whether the UI is about to appear onscreen" - Apple, "Managing your app's
 *   life cycle").
 * - Android (`ReactAndroid/.../modules/appstate/AppStateModule.kt`) never
 *   reports `inactive`, only `active` from the activity's `onResume` and
 *   `background` from its `onPause`. That makes `background` broader than on
 *   iOS - RN's AppState docs: "on another `Activity`, including temporary
 *   system activities such as autofill credential pickers (even if launched by
 *   your app or the system)". A runtime permission request may start one
 *   (`Activity#requestPermissions`: "you should be prepared that your activity
 *   may be paused and resumed"), and so do the share sheet, system pickers and
 *   Custom Tabs, so coming back from any of those is a return here. The
 *   notification shade is not: system windows "such as the status bar
 *   notification panel or a system alert ... temporarily take window input
 *   focus without pausing the foreground activity"
 *   (`Activity#onWindowFocusChanged`), which RN reports as AppState's `blur`
 *   event rather than a `change`.
 * - Web (react-native-web) reports only `active` and `background`, from the
 *   document's visibility, so a return is the tab becoming visible again.
 *
 * All listeners share one latch, armed by `background` and spent by the next
 * `active`, and one id counter. The latch is seeded from
 * `AppState.currentState` when the first listener subscribes, so a listener
 * attached while the app is backgrounded still hears the return that follows,
 * and it keeps tracking from then on, so later listeners join it rather than
 * seeding their own. A process that starts in the background (an iOS launch to
 * handle a remote notification, or Android when `AppStateModule` is created
 * before the activity has resumed and starts at `background`) therefore counts
 * its first `active` as a return.
 */
export function onAppReturnedFromBackground(
  cb: (appReturn: AppReturn) => void,
) {
  trackReturns()
  // wrapped so that subscribing the same `cb` twice gives two subscriptions
  const listener = (appReturn: AppReturn) => cb(appReturn)
  returnListeners.add(listener)
  return {
    remove: () => {
      returnListeners.delete(listener)
    },
  }
}

/**
 * {@link onAppReturnedFromBackground} as a hook. Subscribes once per mount and
 * always calls the latest `cb`, so an inline callback doesn't resubscribe on
 * every render.
 */
export function useOnAppReturnedFromBackground(
  cb: (appReturn: AppReturn) => void,
) {
  const onReturn = useEffectEvent(cb)
  useEffect(() => {
    const sub = onAppReturnedFromBackground(appReturn => onReturn(appReturn))
    return () => sub.remove()
  }, [])
}
