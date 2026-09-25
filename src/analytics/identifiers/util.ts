import * as env from '#/env'

const ONE_MIN = 60 * 1e3
const TTL = (env.IS_NATIVE ? 5 : 30) * ONE_MIN // 5 min on native

export function isSessionIdExpired(since: number | undefined) {
  if (since === undefined || !Number.isFinite(since)) return false
  return Date.now() - since >= TTL
}

/** Canonical persisted state for an analytics session. */
export type SessionRecord = {
  id: string
  inactivityAt?: number
  rotatedAt: number
}

function normalizeTimestamp(value: unknown, now: number) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(value, now)
    : undefined
}

export function normalizeSessionRecord(
  value: unknown,
  now = Date.now(),
): SessionRecord | undefined {
  if (!value || typeof value !== 'object') return undefined

  const record = value as Partial<SessionRecord>
  if (typeof record.id !== 'string' || !record.id) return undefined

  const rotatedAt = normalizeTimestamp(record.rotatedAt, now)

  return {
    id: record.id,
    inactivityAt: normalizeTimestamp(record.inactivityAt, now),
    rotatedAt: rotatedAt ?? now,
  }
}

export function shouldRotateSession(record: SessionRecord) {
  return (
    isSessionIdExpired(record.inactivityAt) &&
    isSessionIdExpired(record.rotatedAt)
  )
}
