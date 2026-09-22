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
const runtimeWindow = window

function createSessionRecord(now = Date.now()): SessionRecord {
  return {
    id: String(uuid.v4()),
    rotatedAt: now,
  }
}

function parseSessionRecord(rawRecord: string | null, now = Date.now()) {
  if (!rawRecord) return undefined
  try {
    return normalizeSessionRecord(JSON.parse(rawRecord), now)
  } catch {
    return undefined
  }
}

function readSessionRecord(now = Date.now()) {
  return parseSessionRecord(
    runtimeWindow.localStorage.getItem(SESSION_RECORD_KEY),
    now,
  )
}

function readSessionToMigrate(now = Date.now()) {
  return parseSessionRecord(
    runtimeWindow.sessionStorage.getItem(SESSION_RECORD_KEY),
    now,
  )
}

function writeSessionRecord(record: SessionRecord) {
  runtimeWindow.localStorage.setItem(SESSION_RECORD_KEY, JSON.stringify(record))
}

function removeSessionStorageRecord() {
  runtimeWindow.sessionStorage.removeItem(SESSION_RECORD_KEY)
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
  const existing = readSessionRecord(now) ?? readSessionToMigrate(now)
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
  removeSessionStorageRecord()
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

function updateSessionRecord(record: SessionRecord) {
  const sessionIdChanged = record.id !== sessionRecord.id
  sessionRecord = record
  if (sessionIdChanged) {
    notifyListeners()
  }
}

function persistSessionRecord(record: SessionRecord) {
  writeSessionRecord(record)
  updateSessionRecord(record)
}

function onSessionRecordStorageChanged(event: StorageEvent) {
  if (
    event.key !== SESSION_RECORD_KEY ||
    event.storageArea !== runtimeWindow.localStorage
  ) {
    return
  }

  const record = parseSessionRecord(event.newValue)
  if (record) {
    if (currentAppState === 'active' && record.inactivityAt !== undefined) {
      persistSessionRecord({...record, inactivityAt: undefined})
    } else {
      updateSessionRecord(record)
    }
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
  runtimeWindow.addEventListener('storage', onSessionRecordStorageChanged)
  sessionRecord = readSessionRecord() ?? sessionRecord
  appStateSubscription = onAppStateChange(onAppStateChanged)
}

function stopCoordinator() {
  runtimeWindow.removeEventListener('storage', onSessionRecordStorageChanged)
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
