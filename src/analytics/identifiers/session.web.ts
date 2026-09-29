import {useSyncExternalStore} from 'react'
import {type AppStateStatus} from 'react-native'
import uuid from 'react-native-uuid'

import {onAppStateChange} from '#/lib/appState'
import {
  isSessionIdExpired,
  type SessionRecord,
} from '#/analytics/identifiers/util'

const SESSION_RECORD_KEY = 'bsky_session'

function createSessionRecord(now = Date.now()): SessionRecord {
  return {
    id: String(uuid.v4()),
    lastEventAt: now,
  }
}

function readSessionRecord() {
  const value = window.sessionStorage.getItem(SESSION_RECORD_KEY)
  return value ? (JSON.parse(value) as SessionRecord) : undefined
}

function writeSessionRecord(record: SessionRecord) {
  window.sessionStorage.setItem(SESSION_RECORD_KEY, JSON.stringify(record))
}

let sessionRecord = (() => {
  const now = Date.now()
  const existing = readSessionRecord()
  const record =
    existing && !isSessionIdExpired(existing.lastEventAt)
      ? {...existing, lastEventAt: now}
      : createSessionRecord(now)
  writeSessionRecord(record)
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
  writeSessionRecord(sessionRecord)
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
