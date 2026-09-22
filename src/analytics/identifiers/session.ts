import {useSyncExternalStore} from 'react'
import {type AppStateStatus} from 'react-native'
import uuid from 'react-native-uuid'

import {onAppStateChange} from '#/lib/appState'
import {isSessionIdExpired} from '#/analytics/identifiers/util'
import {device} from '#/storage'

const initialSessionId = (() => {
  const existing = device.get(['nativeSessionId'])
  const lastEvent = device.get(['nativeSessionIdLastEventAt'])
  const id = existing && !isSessionIdExpired(lastEvent) ? existing : uuid.v4()
  device.set(['nativeSessionId'], id)
  device.set(['nativeSessionIdLastEventAt'], Date.now())
  return id
})()

export function getInitialSessionId() {
  return getSessionId()
}

export function getSessionId() {
  return device.get(['nativeSessionId']) ?? initialSessionId
}

const listeners = new Set<() => void>()
let appStateSubscription: ReturnType<typeof onAppStateChange> | undefined
let storageSubscription:
  ReturnType<typeof device.addOnValueChangedListener> | undefined

function notifyListeners() {
  listeners.forEach(listener => listener())
}

function onAppStateChanged(state: AppStateStatus) {
  if (state === 'active') {
    const lastEvent = device.get(['nativeSessionIdLastEventAt'])
    if (isSessionIdExpired(lastEvent)) {
      device.set(['nativeSessionId'], uuid.v4())
    }
  }
  device.set(['nativeSessionIdLastEventAt'], Date.now())
}

function startCoordinator() {
  storageSubscription = device.addOnValueChangedListener(
    ['nativeSessionId'],
    notifyListeners,
  )
  appStateSubscription = onAppStateChange(onAppStateChanged)
}

function stopCoordinator() {
  storageSubscription?.remove()
  storageSubscription = undefined
  appStateSubscription?.remove()
  appStateSubscription = undefined
}

export function subscribeToSessionId(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) {
    startCoordinator()
  }

  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      stopCoordinator()
    }
  }
}

export function useSessionId() {
  return useSyncExternalStore(subscribeToSessionId, getSessionId)
}
