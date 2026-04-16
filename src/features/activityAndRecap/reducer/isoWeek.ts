/**
 * ISO-week helpers for the weekly recap (ticket i9KLo7kw).
 *
 * Week ID is 'YYYY-Www' (e.g. '2026-W15'), Monday 00:00 through
 * Sunday 23:59:59.999 local. The 06:00 Monday surface-visibility gate
 * (B1) is enforced separately in `useRecapCardVisibility`.
 *
 * Uses date-fns for ISO week/year math (sanctioned per ARCHITECTURE.md).
 */

import {
  addDays,
  endOfISOWeek,
  getISOWeek,
  getISOWeekYear,
  startOfISOWeek,
  subWeeks,
} from 'date-fns'

/** Format an ISO week as 'YYYY-Www' (2-digit week). */
export function formatWeekIso(date: Date): string {
  const year = getISOWeekYear(date)
  const week = getISOWeek(date)
  return `${year}-W${String(week).padStart(2, '0')}`
}

/**
 * Return the Monday-00:00 local start date for the ISO week containing
 * `date`. Honors the caller's local tz (date-fns uses the local offset).
 */
export function weekStart(date: Date): Date {
  return startOfISOWeek(date)
}

/** Sunday 23:59:59.999 local end of the ISO week containing `date`. */
export function weekEnd(date: Date): Date {
  return endOfISOWeek(date)
}

/**
 * Return the weekIso for the previous ISO week (for the recap card,
 * which always looks back at N-1).
 */
export function priorWeekIso(date: Date): string {
  return formatWeekIso(subWeeks(date, 1))
}

/**
 * Return the current weekIso.
 */
export function currentWeekIso(date: Date): string {
  return formatWeekIso(date)
}

/**
 * Enumerate the last `count` ISO weeks' IDs, most recent first. Used by
 * PastRecaps (B5) with count=4.
 */
export function lastNWeekIsos(date: Date, count: number): string[] {
  const out: string[] = []
  for (let i = 1; i <= count; i++) {
    out.push(formatWeekIso(subWeeks(date, i)))
  }
  return out
}

/**
 * Return the [start, end] local Date range for the ISO week of `date`.
 */
export function weekWindow(date: Date): {start: Date; end: Date} {
  return {start: weekStart(date), end: weekEnd(date)}
}

/**
 * Given a weekIso like '2026-W15', reconstruct a reference Date
 * inside that week (Thursday of the ISO week — which is always in the
 * ISO year). Useful for building the window from a stored weekIso.
 */
export function parseWeekIsoToDate(weekIso: string): Date | null {
  const m = /^(\d{4})-W(\d{2})$/.exec(weekIso)
  if (!m) return null
  const year = Number(m[1])
  const week = Number(m[2])
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(week) ||
    week < 1 ||
    week > 53
  ) {
    return null
  }
  // Jan 4 is always in ISO week 1 of `year`. Walk forward `week-1` weeks
  // and land on Thursday.
  const jan4 = new Date(year, 0, 4)
  const w1Monday = startOfISOWeek(jan4)
  const targetMonday = addDays(w1Monday, (week - 1) * 7)
  return addDays(targetMonday, 3) // Thursday — safely inside the week
}

/**
 * Resolve the Mon 00:00 / Sun 23:59:59.999 window for a weekIso.
 * Returns null if the weekIso is malformed.
 */
export function weekWindowForIso(
  weekIso: string,
): {start: Date; end: Date} | null {
  const anchor = parseWeekIsoToDate(weekIso)
  if (!anchor) return null
  return weekWindow(anchor)
}
