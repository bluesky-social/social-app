import {useSyncExternalStore} from 'react'
import {type AppStateStatus} from 'react-native'
import uuid from 'react-native-uuid'

import {onAppStateChange} from '#/lib/appState'
import {
  isSessionIdExpired,
  type SessionRecord,
} from '#/analytics/identifiers/util'
import {device} from '#/storage'

function createSessionRecord(now = Date.now()): SessionRecord {
  return {
    id: String(uuid.v4()),
    lastEventAt: now,
  }
}

let sessionRecord = (() => {
  const now = Date.now()
  const existing = device.get(['nativeSession'])
  const record =
    existing && !isSessionIdExpired(existing.lastEventAt)
      ? {...existing, lastEventAt: now}
      : createSessionRecord(now)
  device.set(['nativeSession'], record)
  return record
})()

export function getInitialSessionId() {
  return getSessionId()
}

/**
 * Gets the current session ID. The module-level app-state listener keeps this
 * value current between foreground/background transitions.
 */
export function getSessionId() {
  return sessionRecord.id
}

const listeners = new Set<() => void>()

function notifyListeners() {
  listeners.forEach(listener => listener())
}

function onAppStateChanged(state: AppStateStatus) {
  const now = Date.now()
  const previousId = sessionRecord.id
  sessionRecord =
    state === 'active' && isSessionIdExpired(sessionRecord.lastEventAt)
      ? createSessionRecord(now)
      : {...sessionRecord, lastEventAt: now}
  device.set(['nativeSession'], sessionRecord)
  if (sessionRecord.id !== previousId) {
    notifyListeners()
  }
}

onAppStateChange(onAppStateChanged)

export function subscribeToSessionId(listener: () => void) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export function useSessionId() {
  return useSyncExternalStore(subscribeToSessionId, getSessionId)
}
