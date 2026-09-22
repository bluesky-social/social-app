import {useSyncExternalStore} from 'react'
import {type AppStateStatus} from 'react-native'
import uuid from 'react-native-uuid'

import {getCurrentState, onAppStateChange} from '#/lib/appState'
import {
  normalizeSessionRecord,
  type SessionRecord,
  shouldRotateSession,
} from '#/analytics/identifiers/util'

const SESSION_RECORD_KEY = 'bsky_analytics_session_v1'
const LEGACY_SESSION_ID_KEY = 'bsky_session_id'
const LEGACY_LAST_EVENT_KEY = 'bsky_session_id_last_event_at'

function createSessionRecord(now = Date.now()): SessionRecord {
  return {
    id: String(uuid.v4()),
    rotatedAt: now,
  }
}

function migrateLegacySession(now = Date.now()): SessionRecord | undefined {
  const id = window.sessionStorage.getItem(LEGACY_SESSION_ID_KEY)
  if (!id) return undefined

  const lastEventStr = window.sessionStorage.getItem(LEGACY_LAST_EVENT_KEY)
  const lastEventAt = lastEventStr ? Number(lastEventStr) : undefined
  const validLastEventAt = Number.isFinite(lastEventAt)
    ? lastEventAt
    : undefined
  return normalizeSessionRecord(
    {
      id,
      inactivityAt: validLastEventAt,
      rotatedAt: validLastEventAt ?? now,
    },
    now,
  )
}

function readSessionRecord(now = Date.now()) {
  const rawRecord = window.sessionStorage.getItem(SESSION_RECORD_KEY)
  if (rawRecord) {
    try {
      const record = normalizeSessionRecord(JSON.parse(rawRecord), now)
      if (record) return record
    } catch {
      // Fall through to legacy migration.
    }
  }
  return migrateLegacySession(now)
}

function writeSessionRecord(record: SessionRecord) {
  window.sessionStorage.setItem(SESSION_RECORD_KEY, JSON.stringify(record))
}

function removeLegacySession() {
  window.sessionStorage.removeItem(LEGACY_SESSION_ID_KEY)
  window.sessionStorage.removeItem(LEGACY_LAST_EVENT_KEY)
}

function resolveSessionForActivation(now = Date.now()) {
  const latest = readSessionRecord(now)
  if (!latest || shouldRotateSession(latest)) {
    return createSessionRecord(now)
  }
  return latest
}

let currentAppState = getCurrentState()
let sessionRecord = (() => {
  const now = Date.now()
  const existing = readSessionRecord(now)
  let record: SessionRecord

  if (currentAppState === 'active' && existing) {
    record = shouldRotateSession(existing)
      ? resolveSessionForActivation(now)
      : existing
    record = {...record, inactivityAt: undefined}
  } else {
    record = existing ?? createSessionRecord(now)
  }

  if (currentAppState !== 'active' && record.inactivityAt === undefined) {
    record = {...record, inactivityAt: now}
  }

  writeSessionRecord(record)
  removeLegacySession()
  return record
})()

export function getInitialSessionId() {
  return getSessionId()
}

export function getSessionId() {
  return sessionRecord.id
}

const listeners = new Set<() => void>()
let appStateSubscription: ReturnType<typeof onAppStateChange> | undefined

function notifyListeners() {
  listeners.forEach(listener => listener())
}

function persistSessionRecord(record: SessionRecord) {
  writeSessionRecord(record)
  const sessionIdChanged = record.id !== sessionRecord.id
  sessionRecord = record
  if (sessionIdChanged) {
    notifyListeners()
  }
}

function onAppStateChanged(nextAppState: AppStateStatus) {
  const now = Date.now()

  if (nextAppState === 'active') {
    const record = resolveSessionForActivation(now)
    persistSessionRecord({...record, inactivityAt: undefined})
  } else if (currentAppState === 'active') {
    const record = readSessionRecord(now) ?? createSessionRecord(now)
    persistSessionRecord({
      ...record,
      inactivityAt: record.inactivityAt ?? now,
    })
  }

  currentAppState = nextAppState
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
