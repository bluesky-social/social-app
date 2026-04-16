/**
 * useRecapCardVisibility (S12) — orchestrates whether the WeeklyRecapCard
 * should mount on the Notifications header slot.
 *
 * Predicate (all must be true):
 *   - useStreaksAndRecapEnabled() (X6)
 *   - hasSession (A7)
 *   - showRecap preference (X1)
 *   - prior week had a qualifying visit (G7) — heuristic: streak store
 *     `lastVisitDay` falls within the prior ISO week
 *   - !dismissed[weekIso] (B5)
 *   - firstShownAt == null OR (now - firstShownAt) < RECAP_CARD_MAX_AGE_MS (B6)
 *   - now >= Monday RECAP_CARD_MONDAY_SHOW_HOUR_LOCAL (B1)
 *
 * Returns the resolved weekIso when visible (so the card can pass it
 * straight to `useWeeklyRecapQuery`); null when hidden.
 */

import {useSession} from '#/state/session'
import {
  RECAP_CARD_MAX_AGE_MS,
  RECAP_CARD_MONDAY_SHOW_HOUR_LOCAL,
} from '#/features/activityAndRecap/constants'
import {useShowRecapPreference} from '#/features/activityAndRecap/hooks/useShowRecapPreference'
import {useStreaksAndRecapEnabled} from '#/features/activityAndRecap/hooks/useStreaksAndRecapEnabled'
import {useStreakStore} from '#/features/activityAndRecap/hooks/useStreakStore'
import {
  priorWeekIso,
  weekWindowForIso,
} from '#/features/activityAndRecap/reducer/isoWeek'
import {
  getRecapCardFirstShown,
  isRecapWeekDismissed,
} from '#/features/activityAndRecap/storage'

/**
 * Returns the prior weekIso when the card should be visible, otherwise null.
 *
 * Pure(-ish): only reads MMKV via the storage helpers; never writes. The
 * `now` parameter is injectable for tests.
 */
export function useRecapCardVisibility(now: Date = new Date()): string | null {
  const featureOn = useStreaksAndRecapEnabled()
  const {hasSession, currentAccount} = useSession()
  const [showRecap] = useShowRecapPreference()
  const streak = useStreakStore()

  if (!featureOn) return null
  if (!hasSession) return null
  if (!showRecap) return null
  const did = currentAccount?.did
  if (!did) return null

  // B1: card surfaces only on or after Monday 06:00 local.
  if (!isAfterMondaySurfaceHour(now)) return null

  const weekIso = priorWeekIso(now)
  const window = weekWindowForIso(weekIso)
  if (!window) return null

  // G7: don't surface for users with zero qualifying visits in the prior
  // week. Heuristic: lastVisitDay must fall within the window. We avoid
  // over-counting by treating an absent streak store as "no visit".
  if (!streak) return null
  const lastVisitMs = parseDayString(streak.lastVisitDay)
  if (lastVisitMs == null) return null
  if (
    lastVisitMs < window.start.getTime() ||
    lastVisitMs > window.end.getTime() + 24 * 60 * 60 * 1000
  ) {
    return null
  }

  // B5: respect user's dismissal for this weekIso.
  if (isRecapWeekDismissed(did, weekIso)) return null

  // B6: auto-hide after 7d from firstShownAt.
  const firstShown = getRecapCardFirstShown(did, weekIso)
  if (
    firstShown != null &&
    now.getTime() - firstShown >= RECAP_CARD_MAX_AGE_MS
  ) {
    return null
  }

  return weekIso
}

function isAfterMondaySurfaceHour(now: Date): boolean {
  // Local-time Monday cutoff. Sunday<23:59 → already invisible (last week's
  // window hasn't closed). Monday<06:00 → still invisible.
  const dow = now.getDay() // 0 Sunday, 1 Monday, ..., 6 Saturday
  if (dow === 0) return false
  if (dow === 1 && now.getHours() < RECAP_CARD_MONDAY_SHOW_HOUR_LOCAL) {
    return false
  }
  return true
}

/**
 * Parse a 'YYYY-MM-DD' day string into a UTC ms anchor (used for window
 * comparison). The window itself is local; the comparison only requires
 * relative ordering, so a UTC anchor is sufficient.
 */
function parseDayString(day: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day)
  if (!m) return null
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}
