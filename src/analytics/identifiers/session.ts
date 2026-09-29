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

function createSessionRecord(): SessionRecord {
  const record = {id: String(uuid.v4()), lastEventAt: Date.now()}
  device.set(['analyticsSession'], record)
  return record
}

/** The module-level app-state listener keeps this current without subscribers. */
export function getSessionId() {
  // Missing or corrupt storage starts a fresh session, never an old fallback ID.
  return (readSessionRecord() ?? createSessionRecord()).id
}

function onAppStateChanged(state: AppStateStatus) {
  const existing = readSessionRecord()
  if (
    !existing ||
    (state === 'active' && isSessionIdExpired(existing.lastEventAt))
  ) {
    createSessionRecord()
    return
  }
  device.set(['analyticsSession'], {...existing, lastEventAt: Date.now()})
}

// Initialize once, then track lifecycle even before analytics contexts mount.
onAppStateChanged('active')
onAppStateChange(onAppStateChanged)
