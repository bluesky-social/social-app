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

function onAppStateChanged(state: AppStateStatus) {
  if (state === 'active') {
    const lastEvent = device.get(['nativeSessionIdLastEventAt'])
    if (isSessionIdExpired(lastEvent)) {
      device.set(['nativeSessionId'], uuid.v4())
    }
  }
  device.set(['nativeSessionIdLastEventAt'], Date.now())
}

class SessionStore {
  private listeners = new Set<() => void>()
  private appStateSubscription: ReturnType<typeof onAppStateChange> | undefined
  private storageSubscription:
    ReturnType<typeof device.addOnValueChangedListener> | undefined

  getSnapshot = getSessionId

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    if (this.listeners.size === 1) {
      this.start()
    }

    return () => {
      this.listeners.delete(listener)
      if (this.listeners.size === 0) {
        this.stop()
      }
    }
  }

  private notify = () => {
    this.listeners.forEach(listener => listener())
  }

  private start() {
    this.storageSubscription = device.addOnValueChangedListener(
      ['nativeSessionId'],
      this.notify,
    )
    this.appStateSubscription = onAppStateChange(onAppStateChanged)
  }

  private stop() {
    this.storageSubscription?.remove()
    this.storageSubscription = undefined
    this.appStateSubscription?.remove()
    this.appStateSubscription = undefined
  }
}

const store = new SessionStore()

export function subscribeToSessionId(listener: () => void) {
  return store.subscribe(listener)
}

export function useSessionId() {
  return useSyncExternalStore(store.subscribe, store.getSnapshot)
}
