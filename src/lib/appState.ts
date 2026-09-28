import {useEffect, useEffectEvent, useState} from 'react'
import {AppState, type AppStateStatus} from 'react-native'

import {IS_ANDROID} from '#/env'

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

/** Android only: scopes opened by {@link beginAppInitiatedActivity}. */
const activityScopes = new Set<symbol>()
/**
 * The scopes that were open when the app last went to the background, if any
 * were: the trip away is theirs, and the `active` that ends it ends them too.
 */
let scopesOfTrip: Set<symbol> | undefined

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
      if (activityScopes.size > 0) {
        scopesOfTrip = new Set(activityScopes)
      } else {
        hasBeenBackgrounded = true
      }
    } else if (next === 'active') {
      if (scopesOfTrip) {
        /*
         * Only the scopes that were open when the trip began: one opened since
         * (the next step of a flow, started when this step's result arrived
         * ahead of this event) covers the trip that is still to come.
         */
        for (const scope of scopesOfTrip) activityScopes.delete(scope)
        scopesOfTrip = undefined
      }
      if (hasBeenBackgrounded) {
        hasBeenBackgrounded = false
        const appReturn: AppReturn = {id: ++lastReturnId, timestamp: Date.now()}
        for (const listener of [...returnListeners]) {
          // an earlier listener may have removed this one
          if (returnListeners.has(listener)) listener(appReturn)
        }
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
 *   may be paused and resumed"), and so do the share sheet, system pickers,
 *   the image cropper and Custom Tabs, all of which iOS shows inside the app.
 *   To match iOS, the calls that open them are wrapped in
 *   {@link runAppInitiatedActivity} or {@link beginAppInitiatedActivity}: a
 *   `background` that starts while one is open doesn't arm the latch, so the
 *   `active` that ends the trip isn't a return. Two gaps remain. Activities the
 *   system starts on its own, such as the autofill credential picker, still
 *   count. And pressing Home while one of ours is open doesn't, because the
 *   app already went to the background when it opened, whereas on iOS that
 *   press is a return. The notification shade doesn't reach AppState at all:
 *   system windows "such as the status bar notification panel or a system
 *   alert ... temporarily take window input focus without pausing the
 *   foreground activity" (`Activity#onWindowFocusChanged`), which RN reports as
 *   AppState's `blur` event rather than a `change`.
 * - Web (react-native-web) reports only `active` and `background`, from the
 *   document's visibility, so a return is the tab becoming visible again.
 *
 * All listeners share one latch, armed by `background` and spent by the next
 * `active`, and one id counter. The latch is seeded from
 * `AppState.currentState` when the first listener subscribes (or, on Android,
 * the first scope opens), so a listener attached while the app is backgrounded
 * still hears the return that follows, and it keeps tracking from then on, so
 * later listeners join it rather than seeding their own. A process that starts
 * in the background (an iOS launch to handle a remote notification, or Android
 * when `AppStateModule` is created before the activity has resumed and starts
 * at `background`) therefore counts its first `active` as a return.
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

/**
 * Marks the start of something the app does that may open another Android
 * activity over its own, such as a permission dialog, a system picker, the
 * share sheet or a Custom Tab, and returns a function that marks its end.
 * While it is open, a trip to the background doesn't count as a return: see
 * {@link onAppReturnedFromBackground}. Does nothing on iOS and web, where
 * those flows stay inside the app and a trip to the background while one is
 * showing is a real one.
 *
 * Prefer {@link runAppInitiatedActivity} for a call that settles once the
 * activity has closed. Use this directly for one that settles as soon as the
 * activity has launched, like RN's `Share.share` and expo-web-browser's
 * `openBrowserAsync` on Android: ending the scope then would end it before the
 * app has even left, so end it only if the launch fails, and otherwise leave it
 * to the trip.
 *
 * A trip ends every scope that was open when it began, so a scope that is never
 * ended - a promise that never settles, or a launch that never left the app -
 * can hide at most one trip that wasn't really its own.
 */
export function beginAppInitiatedActivity() {
  if (!IS_ANDROID) return () => {}
  trackReturns()
  const scope = Symbol('appInitiatedActivity')
  activityScopes.add(scope)
  return () => {
    activityScopes.delete(scope)
  }
}

/**
 * Runs `fn` inside a {@link beginAppInitiatedActivity} scope that ends when
 * `fn` settles, for a call that settles once the activity it opens has closed,
 * such as a permission request or a picker.
 */
export async function runAppInitiatedActivity<T>(
  fn: () => Promise<T>,
): Promise<T> {
  const end = beginAppInitiatedActivity()
  try {
    return await fn()
  } finally {
    end()
  }
}
