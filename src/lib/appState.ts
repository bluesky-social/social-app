import {useEffect, useEffectEvent, useState} from 'react'
import {AppState, type AppStateStatus} from 'react-native'

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
 * Android backgrounds the app for its own activities (pickers, share sheets,
 * etc.), so it needs a longer cutoff than iOS to filter those trips.
 */
export const RETURN_MIN_TIME_AWAY = IS_IOS ? 30 * 1000 : 60 * 1000

const returnListeners = new Set<(appReturn: AppReturn) => void>()
let isTrackingReturns = false
let lastReturnId = 0

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
      if (timeAway < RETURN_MIN_TIME_AWAY) return
      const appReturn: AppReturn = {id: ++lastReturnId, timestamp: now}
      for (const listener of [...returnListeners]) {
        // an earlier listener may have removed this one
        if (returnListeners.has(listener)) listener(appReturn)
      }
    }
  })
}

/**
 * Calls `cb` on the first `active` after at least {@link RETURN_MIN_TIME_AWAY}
 * in `background`. An `inactive` interruption alone does not count.
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

/** Hook form of {@link onAppReturnedFromBackground}, using the latest `cb`. */
export function useOnAppReturnedFromBackground(
  cb: (appReturn: AppReturn) => void,
) {
  const onReturn = useEffectEvent(cb)
  useEffect(() => {
    const sub = onAppReturnedFromBackground(appReturn => onReturn(appReturn))
    return () => sub.remove()
  }, [])
}
