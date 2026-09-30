import {type AppStateStatus} from 'react-native'
import uuid from 'react-native-uuid'
import {z} from 'zod'

import {onAppStateChange} from '#/lib/appState'
import {readRawSessionRecord} from '#/analytics/identifiers/sessionStorage'
import * as env from '#/env'
import {device} from '#/storage'

const ONE_MIN = 60 * 1e3
const TTL = 5 * ONE_MIN

const sessionRecordSchema = z.object({
  id: z.string().min(1),
  lastEventAt: z.number().finite().optional().catch(undefined),
})
/** Raw device storage includes the `{data: value}` envelope. */
const storedSessionRecordSchema = z.object({data: sessionRecordSchema})

/** lastEventAt tracks native lifecycle events or qualifying web activity. */
export type SessionRecord = z.infer<typeof sessionRecordSchema>

function isSessionIdExpired(since: number | undefined) {
  if (since === undefined) return false
  return Date.now() - since >= TTL
}

/**
 * Keep only the last raw value and its validation result. Comparing the entire
 * serialized record also detects timestamp-only changes that affect expiry.
 */
let cachedRaw: string | undefined
let cachedRecord: SessionRecord | undefined

/** Validate only when the platform-specific reader returns a changed value. */
export function readSessionRecord() {
  const raw = readRawSessionRecord()

  /**
   * Lightweight memoization to avoid re-parsing and validating if raw value
   * didn't change
   */
  if (raw === cachedRaw) return cachedRecord

  let record: SessionRecord | undefined
  if (raw) {
    try {
      const result = storedSessionRecordSchema.safeParse(JSON.parse(raw))
      if (result.success) record = result.data.data
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error
    }
  }
  /*
   * Missing or invalid data must evict the previous valid result too, allowing
   * callers to create a fresh session instead of reviving a stale one.
   */
  cachedRaw = raw
  cachedRecord = record
  return record
}

function createSessionRecord(): SessionRecord {
  const record: SessionRecord = {
    id: String(uuid.v4()),
    ...(env.IS_NATIVE ? {lastEventAt: Date.now()} : {}),
  }
  device.set(['analyticsSession'], record)
  return record
}

/** Resolve identity without counting passive metrics or logs as activity. */
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

// Web activity belongs to the centrally mounted hook, not RN Web AppState.
if (env.IS_NATIVE) {
  onAppStateChanged('active')
  onAppStateChange(onAppStateChanged)
}
