import {useSyncExternalStore} from 'react'
import {type AppStateStatus} from 'react-native'
import uuid from 'react-native-uuid'
import {z} from 'zod'

import {onAppStateChange} from '#/lib/appState'
import * as env from '#/env'
import {device} from '#/storage'

const ONE_MIN = 60 * 1e3
const TTL = (env.IS_NATIVE ? 5 : 30) * ONE_MIN // 5 min on native

const sessionRecordSchema = z.object({
  id: z.string().min(1),
  lastEventAt: z.number().finite().optional().catch(undefined),
})

/** The session ID and its last app-state event are persisted together. */
export type SessionRecord = z.infer<typeof sessionRecordSchema>

function isSessionIdExpired(since: number | undefined) {
  if (since === undefined) return false
  return Date.now() - since >= TTL
}

function readSessionRecord() {
  try {
    const result = sessionRecordSchema.safeParse(
      device.get(['analyticsSession']),
    )
    return result.success ? result.data : undefined
  } catch (error) {
    if (error instanceof SyntaxError) return undefined
    throw error
  }
}

const initialSessionId = (() => {
  const existing = readSessionRecord()
  const id =
    existing && !isSessionIdExpired(existing.lastEventAt)
      ? existing.id
      : String(uuid.v4())
  device.set(['analyticsSession'], {id, lastEventAt: Date.now()})
  return id
})()

export function getInitialSessionId() {
  return getSessionId()
}

/** The module-level app-state listener keeps this current without subscribers. */
export function getSessionId() {
  return readSessionRecord()?.id ?? initialSessionId
}

const listeners = new Set<() => void>()
let storageSubscription:
  ReturnType<typeof device.addOnValueChangedListener> | undefined

function onAppStateChanged(state: AppStateStatus) {
  const existing = readSessionRecord()
  const record: SessionRecord = {
    id:
      state === 'active' && isSessionIdExpired(existing?.lastEventAt)
        ? String(uuid.v4())
        : (existing?.id ?? initialSessionId),
    lastEventAt: Date.now(),
  }
  device.set(['analyticsSession'], record)
}

// Track lifecycle events even before analytics contexts mount.
onAppStateChange(onAppStateChanged)

/** On web, device storage notifies local writes only; this does not coordinate tabs. */
export function subscribeToSessionId(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) {
    storageSubscription = device.addOnValueChangedListener(
      ['analyticsSession'],
      () => listeners.forEach(notify => notify()),
    )
  }

  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      storageSubscription?.remove()
      storageSubscription = undefined
    }
  }
}

export function useSessionId() {
  return useSyncExternalStore(subscribeToSessionId, getSessionId)
}
