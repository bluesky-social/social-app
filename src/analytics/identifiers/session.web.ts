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

function writeSessionRecord(record: SessionRecord) {
  runtimeWindow.localStorage.setItem(SESSION_RECORD_KEY, JSON.stringify(record))
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

function persistInactivityStart(now = Date.now()) {
  const record = readSessionRecord(now) ?? createSessionRecord(now)
  persistSessionRecord({
    ...record,
    inactivityAt: record.inactivityAt ?? now,
  })
}

function selectCanonicalSessionRecord(record: SessionRecord) {
  if (record.id === sessionRecord.id) return record

  if (record.rotatedAt !== sessionRecord.rotatedAt) {
    return record.rotatedAt > sessionRecord.rotatedAt ? record : sessionRecord
  }

  return record.id < sessionRecord.id ? record : sessionRecord
}

function reconcileSessionRecord(record: SessionRecord) {
  const canonicalRecord = selectCanonicalSessionRecord(record)

  if (canonicalRecord === sessionRecord) {
    writeSessionRecord(sessionRecord)
  } else if (
    currentAppState === 'active' &&
    canonicalRecord.inactivityAt !== undefined
  ) {
    persistSessionRecord({...canonicalRecord, inactivityAt: undefined})
  } else {
    updateSessionRecord(canonicalRecord)
  }
}

function onSessionRecordStorageChanged(event: StorageEvent) {
  if (
    event.key !== SESSION_RECORD_KEY ||
    event.storageArea !== runtimeWindow.localStorage
  ) {
    return
  }

  const record = readSessionRecord()
  if (!record) return
  reconcileSessionRecord(record)
}

function onAppStateChanged(nextAppState: AppStateStatus) {
  const now = Date.now()

  if (nextAppState === 'active') {
    const record = resolveSessionForActivation(now)
    persistSessionRecord({...record, inactivityAt: undefined})
  } else if (currentAppState === 'active') {
    persistInactivityStart(now)
  }

  currentAppState = nextAppState
}

function onPageHide() {
  if (currentAppState !== 'active') return

  persistInactivityStart()
  currentAppState = 'background'
}

function startCoordinator() {
  runtimeWindow.addEventListener('storage', onSessionRecordStorageChanged)
  runtimeWindow.addEventListener('pagehide', onPageHide)
  const persistedRecord = readSessionRecord()
  if (persistedRecord) {
    reconcileSessionRecord(persistedRecord)
  }
  appStateSubscription = onAppStateChange(onAppStateChanged)
}

function stopCoordinator() {
  runtimeWindow.removeEventListener('storage', onSessionRecordStorageChanged)
  runtimeWindow.removeEventListener('pagehide', onPageHide)
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
