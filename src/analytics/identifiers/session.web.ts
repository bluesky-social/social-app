import {useSyncExternalStore} from 'react'
import {type AppStateStatus} from 'react-native'
import uuid from 'react-native-uuid'

import {onAppStateChange} from '#/lib/appState'
import {isSessionIdExpired} from '#/analytics/identifiers/util'

const SESSION_ID_KEY = 'bsky_session_id'
const LAST_EVENT_KEY = 'bsky_session_id_last_event_at'

let sessionId = (() => {
  const existing = window.sessionStorage.getItem(SESSION_ID_KEY)
  const lastEventStr = window.sessionStorage.getItem(LAST_EVENT_KEY)
  const lastEvent = lastEventStr ? Number(lastEventStr) : undefined
  const id = existing && !isSessionIdExpired(lastEvent) ? existing : uuid.v4()
  window.sessionStorage.setItem(SESSION_ID_KEY, id)
  window.sessionStorage.setItem(LAST_EVENT_KEY, String(Date.now()))
  return id
})()

export function getInitialSessionId() {
  return getSessionId()
}

export function getSessionId() {
  return sessionId
}

const listeners = new Set<() => void>()
let appStateSubscription: ReturnType<typeof onAppStateChange> | undefined

function notifyListeners() {
  listeners.forEach(listener => listener())
}

function onAppStateChanged(state: AppStateStatus) {
  if (state === 'active') {
    const lastEventStr = window.sessionStorage.getItem(LAST_EVENT_KEY)
    const lastEvent = lastEventStr ? Number(lastEventStr) : undefined
    if (isSessionIdExpired(lastEvent)) {
      const nextSessionId = uuid.v4()
      window.sessionStorage.setItem(SESSION_ID_KEY, String(nextSessionId))
      sessionId = nextSessionId
      notifyListeners()
    }
  }
  window.sessionStorage.setItem(LAST_EVENT_KEY, String(Date.now()))
}

function startCoordinator() {
  appStateSubscription = onAppStateChange(onAppStateChanged)
}

function stopCoordinator() {
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
