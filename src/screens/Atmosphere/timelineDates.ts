/**
 * Activity remains unheaded while it is within this rolling window.
 */
export const RECENT_ACTIVITY_WINDOW_MS = 3 * 60 * 60 * 1000

/**
 * Date-heading information for one activity row.
 */
export type ActivityDateBucket =
  | {kind: 'recent' | 'invalid'}
  | {kind: 'today' | 'yesterday' | 'older'; key: string; date: Date}

function getLocalDateKey(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Parses an activity timestamp and rejects impossible ISO calendar dates that
 * the JavaScript Date parser would otherwise normalize.
 */
function parseTimestamp(timestamp: string): Date | undefined {
  const date = new Date(timestamp)
  if (!Number.isFinite(date.getTime())) return undefined

  const isoDate = /^(\d{4})-(\d{2})-(\d{2})(?:T|$)/.exec(timestamp)
  if (!isoDate) return date

  const year = Number(isoDate[1])
  const month = Number(isoDate[2])
  const day = Number(isoDate[3])
  if (month < 1 || month > 12 || day < 1) return undefined

  const lastDay = new Date(0)
  lastDay.setUTCFullYear(year, month, 0)
  if (day > lastDay.getUTCDate()) return undefined

  return date
}

/**
 * Returns the local calendar date immediately before `date` without treating a
 * day as a fixed number of milliseconds. This preserves calendar semantics at
 * daylight-saving transitions and in zones whose offset changes at midnight.
 */
function getPreviousLocalDate(date: Date): Date {
  const previous = new Date(date.getTime())
  previous.setHours(12, 0, 0, 0)
  previous.setDate(previous.getDate() - 1)
  return previous
}

/**
 * Classifies an activity timestamp for timeline headings without changing the
 * source order or grouping. Recent activity wins before calendar comparisons,
 * including across midnight. Future timestamps are also recent, so they remain
 * unheaded rather than creating a future-date section.
 */
export function getActivityDateBucket(
  timestamp: string,
  now: Date,
): ActivityDateBucket {
  const date = parseTimestamp(timestamp)
  const nowMs = now.getTime()

  if (!date || !Number.isFinite(nowMs)) {
    return {kind: 'invalid'}
  }

  const ageMs = nowMs - date.getTime()
  if (ageMs <= RECENT_ACTIVITY_WINDOW_MS) {
    return {kind: 'recent'}
  }

  const key = getLocalDateKey(date)
  const todayKey = getLocalDateKey(now)
  if (key === todayKey) {
    return {kind: 'today', key, date}
  }

  const yesterdayKey = getLocalDateKey(getPreviousLocalDate(now))
  if (key === yesterdayKey) {
    return {kind: 'yesterday', key, date}
  }

  return {kind: 'older', key, date}
}
