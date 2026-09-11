import {type LivestreamRecord} from '#/screens/Atmosphere/types'

/**
 * Applies the accepted prototype lifecycle rule: only an explicit endedAt
 * value marks a stream as ended. TODO: Confirm Streamplace endedAt/duration
 * semantics and stale no-end handling with the backend. No-end records may
 * appear live indefinitely; this is accepted for the prototype.
 */
export function getLivestreamStatus(
  record: LivestreamRecord,
): 'active' | 'ended' {
  return record.endedAt !== undefined ? 'ended' : 'active'
}

/**
 * Returns whole elapsed seconds from the raw stream lifecycle timestamps.
 * Activity indexedAt is intentionally not used here.
 */
export function getLivestreamDurationSeconds(
  record: LivestreamRecord,
): number | undefined {
  if (record.endedAt === undefined) return undefined

  const createdAt = Date.parse(record.createdAt)
  const endedAt = Date.parse(record.endedAt)
  if (!Number.isFinite(createdAt) || !Number.isFinite(endedAt)) {
    return undefined
  }

  const seconds = (endedAt - createdAt) / 1000
  return Number.isFinite(seconds) && seconds >= 0
    ? Math.floor(seconds)
    : undefined
}

/**
 * Returns only a real, credential-free HTTP(S) stream URL from the raw record.
 */
export function getLivestreamUrl(record: LivestreamRecord): string | undefined {
  const value = record.url?.trim()
  if (!value || !/^https?:\/\//i.test(value)) return undefined

  try {
    const url = new URL(value)
    if (
      (url.protocol !== 'http:' && url.protocol !== 'https:') ||
      url.username ||
      url.password
    ) {
      return undefined
    }
    return value
  } catch {
    return undefined
  }
}
