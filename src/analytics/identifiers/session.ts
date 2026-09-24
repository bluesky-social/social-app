import {useSyncExternalStore} from 'react'
import {type AppStateStatus} from 'react-native'
import uuid from 'react-native-uuid'

import {getCurrentState, onAppStateChange} from '#/lib/appState'
import {
  normalizeSessionRecord,
  type SessionRecord,
  shouldRotateSession,
} from '#/analytics/identifiers/util'
import {device} from '#/storage'

function createSessionRecord(now = Date.now()): SessionRecord {
  return {
    id: String(uuid.v4()),
    rotatedAt: now,
  }
}

function readSessionRecord(now = Date.now()) {
  try {
    return normalizeSessionRecord(device.get(['nativeSession']), now)
  } catch (error) {
    if (error instanceof SyntaxError) return undefined
    throw error
  }
}

function persistSessionRecord(record: SessionRecord) {
  device.set(['nativeSession'], record)
}

function resolveSessionForActivation(now = Date.now()) {
  const latest = readSessionRecord(now)
  if (!latest || shouldRotateSession(latest)) {
    return createSessionRecord(now)
  }
  return latest
}

let currentAppState = getCurrentState()
const initialSessionRecord = (() => {
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

  persistSessionRecord(record)
  return record
})()

export function getInitialSessionId() {
  return getSessionId()
}

export function getSessionId() {
  return readSessionRecord()?.id ?? initialSessionRecord.id
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
      ['nativeSession'],
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
