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

export function normalizeSessionRecord(
  value: unknown,
  now = Date.now(),
): SessionRecord | undefined {
  if (!value || typeof value !== 'object') return undefined

  const record = value as Partial<SessionRecord>
  if (typeof record.id !== 'string' || !record.id) return undefined

  return {
    id: record.id,
    inactivityAt: Number.isFinite(record.inactivityAt)
      ? record.inactivityAt
      : undefined,
    rotatedAt: Number.isFinite(record.rotatedAt) ? record.rotatedAt! : now,
  }
}

export function shouldRotateSession(record: SessionRecord) {
  return (
    isSessionIdExpired(record.inactivityAt) &&
    isSessionIdExpired(record.rotatedAt)
  )
}
