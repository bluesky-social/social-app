/**
 * IANA-tz day-math helpers. Pure. Zero RN dependencies.
 *
 * Day string = `Intl.DateTimeFormat('en-CA', {timeZone: zone}).format(date)`
 * which returns `YYYY-MM-DD` regardless of DST. The en-CA locale is the
 * only one that guarantees numeric YYYY-MM-DD by default.
 */

/**
 * Format a Date as `YYYY-MM-DD` in the given IANA tz.
 * `zone` must be a resolvable IANA timezone (e.g. 'America/New_York').
 */
export function formatLocalDay(date: Date, zone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/**
 * Returns the caller's current IANA tz, e.g. 'America/New_York'.
 */
export function getCurrentZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/**
 * Parse a 'YYYY-MM-DD' string into a simple numeric triple. Returns null
 * if the input is malformed — the reducer treats that as "unknown".
 */
export function parseLocalDay(
  day: string,
): {year: number; month: number; day: number} | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day)
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  const dom = Number(m[3])
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(dom)
  ) {
    return null
  }
  return {year, month, day: dom}
}

/**
 * Days elapsed from `a` to `b` based on calendar dates alone (in whatever
 * tz produced both strings). Positive if b > a. Returns null for malformed
 * input.
 *
 * Uses UTC midnight as the arithmetic anchor — this is calendar-only math
 * and we explicitly do NOT care about tz for this operation.
 */
export function daysBetweenLocalDays(a: string, b: string): number | null {
  const pa = parseLocalDay(a)
  const pb = parseLocalDay(b)
  if (!pa || !pb) return null
  const MS_DAY = 24 * 60 * 60 * 1000
  const utcA = Date.UTC(pa.year, pa.month - 1, pa.day)
  const utcB = Date.UTC(pb.year, pb.month - 1, pb.day)
  return Math.round((utcB - utcA) / MS_DAY)
}
