import {useEffect, useState} from 'react'
import {AppState, type AppStateStatus} from 'react-native'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {IS_IOS} from '#/env'

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

/** One observed return, shared by every listener. */
export type AppReturn = {
  /** Increases for each return during this JS runtime. */
  readonly id: number
  /** `Date.now()` when the app became active. */
  readonly timestamp: number
}

/**
 * Any return from `background`, significant or not, shared by every listener.
 */
export type AnyAppReturn = {
  /** Increases for each return from `background` during this JS runtime. */
  readonly id: number
  /** `Date.now()` when the app became active. */
  readonly timestamp: number
  /** How long the app was away, measured from the first `background`. */
  readonly timeAway: number
  /**
   * Whether it was away at least {@link RETURN_MIN_TIME_AWAY}, which makes it
   * a significant return (see {@link onAppReturnedFromBackground}).
   */
  readonly isSignificant: boolean
}

/**
 * Android backgrounds the app for its own activities (pickers, share sheets,
 * etc.), so it needs a longer cutoff than iOS to filter those trips.
 */
export const RETURN_MIN_TIME_AWAY = IS_IOS ? 30 * 1000 : 60 * 1000

const returnListeners = new Set<(appReturn: AppReturn) => void>()
const anyReturnListeners = new Set<(appReturn: AnyAppReturn) => void>()
let isTrackingReturns = false
let lastReturnId = 0
let lastAnyReturnId = 0

/**
 * Keep one tracker alive across subscriptions so a new listener cannot lose
 * the background transition that started a trip away.
 */
function trackReturns() {
  if (isTrackingReturns) return
  isTrackingReturns = true

  let backgroundedAt =
    AppState.currentState === 'background' ? Date.now() : undefined
  onAppStateChange(next => {
    if (next === 'background') {
      backgroundedAt ??= Date.now()
    } else if (next === 'active' && backgroundedAt !== undefined) {
      const now = Date.now()
      const timeAway = now - backgroundedAt
      backgroundedAt = undefined
      const isSignificant = timeAway >= RETURN_MIN_TIME_AWAY
      const anyReturn: AnyAppReturn = {
        id: ++lastAnyReturnId,
        timestamp: now,
        timeAway,
        isSignificant,
      }
      for (const listener of [...anyReturnListeners]) {
        // an earlier listener may have removed this one
        if (anyReturnListeners.has(listener)) listener(anyReturn)
      }
      if (!isSignificant) return
      const appReturn: AppReturn = {id: ++lastReturnId, timestamp: now}
      for (const listener of [...returnListeners]) {
        // an earlier listener may have removed this one
        if (returnListeners.has(listener)) listener(appReturn)
      }
    }
  })
}

/**
 * Calls `cb` on a significant return: the first `active` after at least
 * {@link RETURN_MIN_TIME_AWAY} in `background`. An `inactive` interruption
 * alone does not count.
 */
export function onAppReturnedFromBackground(
  cb: (appReturn: AppReturn) => void,
) {
  trackReturns()
  // Give each subscription its own identity, even for the same callback.
  const listener = (appReturn: AppReturn) => cb(appReturn)
  returnListeners.add(listener)
  return {
    remove: () => {
      returnListeners.delete(listener)
    },
  }
}

/**
 * Hook form of {@link onAppReturnedFromBackground}, using the latest `cb`. Not
 * with `useEffectEvent`, which React 19.2 never updates in `memo()` and
 * `forwardRef()` components (react/react#35187).
 */
export function useOnAppReturnedFromBackground(
  cb: (appReturn: AppReturn) => void,
) {
  const onReturn = useNonReactiveCallback(cb)
  useEffect(() => {
    const sub = onAppReturnedFromBackground(appReturn => onReturn(appReturn))
    return () => sub.remove()
  }, [onReturn])
}

/**
 * Calls `cb` on every `active` after `background`, however long the app was
 * away, saying whether it was a significant return (see
 * {@link onAppReturnedFromBackground}). An `inactive` interruption alone does
 * not count.
 */
export function onAnyAppReturn(cb: (appReturn: AnyAppReturn) => void) {
  trackReturns()
  // Give each subscription its own identity, even for the same callback.
  const listener = (appReturn: AnyAppReturn) => cb(appReturn)
  anyReturnListeners.add(listener)
  return {
    remove: () => {
      anyReturnListeners.delete(listener)
    },
  }
}

/**
 * Hook form of {@link onAnyAppReturn}, using the latest `cb`. Not with
 * `useEffectEvent`, which React 19.2 never updates in `memo()` and
 * `forwardRef()` components (react/react#35187).
 */
export function useOnAnyAppReturn(cb: (appReturn: AnyAppReturn) => void) {
  const onReturn = useNonReactiveCallback(cb)
  useEffect(() => {
    const sub = onAnyAppReturn(appReturn => onReturn(appReturn))
    return () => sub.remove()
  }, [onReturn])
}
