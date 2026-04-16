/**
 * Pure reducer for the Activity & Recap streak (ticket i9KLo7kw).
 *
 * Zero React/RN dependencies. Exhaustively unit-tested (AC-A2/A3/A4/A5).
 * The rule sheet lives in `requirements.md §3.3`; summary:
 *
 *   1. UTC monotonic guard (>20h) blocks tz-hop abuse (A5).
 *   2. Same-day dedupe: update anchor, return otherwise unchanged (A1).
 *   3. Consecutive day: +1, clear grace (A2).
 *   4. 1 day skipped + grace unused: keep streak, mark grace used (A3, G2).
 *   5. 1 day skipped + grace used, or 2+ days skipped: reset to 1 (A4).
 *   6. First visit ever: currentStreak = 1 (A2).
 *   7. Tz regression never decrements (A5).
 *   8. longestStreak = max(prev, current); update last-visit fields.
 */

import {STREAK_UTC_MONOTONIC_GUARD_MS} from '#/features/activityAndRecap/constants'
import {daysBetweenLocalDays} from '#/features/activityAndRecap/reducer/dayMath'
import {
  type NowInput,
  STREAK_STORE_VERSION,
  type StreakStore,
} from '#/features/activityAndRecap/types'

/**
 * Compute the next `StreakStore` given the prior state and a `NowInput`.
 *
 * Returning the unchanged `prev` is a signal to the caller that nothing
 * needs to be persisted (cheap fast path). Callers MUST still re-write
 * the anchor when we update `lastVisitAtUtcMs` — we return a new object
 * in that case.
 */
export function computeNextStreak(
  prev: StreakStore | undefined,
  now: NowInput,
): StreakStore {
  // Rule 6: first visit ever.
  if (!prev) {
    return {
      version: STREAK_STORE_VERSION,
      currentStreak: 1,
      longestStreak: 1,
      lastVisitDay: now.localDay,
      lastVisitZone: now.zone,
      lastVisitAtUtcMs: now.utcMs,
      graceUsedForCurrentStreak: false,
    }
  }

  // Defensive: missing/invalid version triggers reset-by-first-visit semantics.
  // This keeps persisted data robust to forward-compat without throwing.
  if (prev.version !== STREAK_STORE_VERSION) {
    return {
      version: STREAK_STORE_VERSION,
      currentStreak: 1,
      longestStreak: Math.max(prev.longestStreak ?? 0, 1),
      lastVisitDay: now.localDay,
      lastVisitZone: now.zone,
      lastVisitAtUtcMs: now.utcMs,
      graceUsedForCurrentStreak: false,
    }
  }

  // Rule 2: same local day (evaluated first so the anchor ratchets even
  // on rapid re-foregrounds within a day). Using the callsite's
  // `now.localDay` against the stored `lastVisitDay` — both strings are
  // in their own zone. A westward tz hop within the same physical day
  // can still land us here (see Rule 7 test).
  if (prev.lastVisitDay === now.localDay) {
    return {
      ...prev,
      lastVisitAtUtcMs: Math.max(prev.lastVisitAtUtcMs, now.utcMs),
      lastVisitZone: now.zone,
    }
  }

  // Rule 1: UTC monotonic guard — must wait >=20h since the last
  // recorded visit before incrementing. Evaluated after same-day dedupe
  // so that a quick re-foreground inside the same day updates the
  // anchor but does nothing else.
  const dtMs = now.utcMs - prev.lastVisitAtUtcMs
  if (dtMs >= 0 && dtMs < STREAK_UTC_MONOTONIC_GUARD_MS) {
    return prev
  }

  // Calendar-days delta. We compute in the prior-visit zone's calendar by
  // using the prior `lastVisitDay` and `now.localDay` strings directly.
  // Rule 7: if the new local day is equal or earlier than the prior
  // recorded one, never decrement — treat as same-day.
  const delta = daysBetweenLocalDays(prev.lastVisitDay, now.localDay)
  if (delta === null || delta <= 0) {
    // Malformed or regression: treat as same-day but ratchet the anchor.
    return {
      ...prev,
      lastVisitAtUtcMs: now.utcMs,
      lastVisitZone: now.zone,
    }
  }

  if (delta === 1) {
    // Rule 3: consecutive day.
    const nextStreak = prev.currentStreak + 1
    return {
      ...prev,
      currentStreak: nextStreak,
      longestStreak: Math.max(prev.longestStreak, nextStreak),
      lastVisitDay: now.localDay,
      lastVisitZone: now.zone,
      lastVisitAtUtcMs: now.utcMs,
      graceUsedForCurrentStreak: false,
    }
  }

  if (delta === 2 && !prev.graceUsedForCurrentStreak) {
    // Rule 4: exactly one day skipped, grace unused. Silent forgiveness.
    return {
      ...prev,
      // currentStreak unchanged
      longestStreak: Math.max(prev.longestStreak, prev.currentStreak),
      lastVisitDay: now.localDay,
      lastVisitZone: now.zone,
      lastVisitAtUtcMs: now.utcMs,
      graceUsedForCurrentStreak: true,
    }
  }

  // Rule 5: 2+ days skipped (delta>=3) OR delta===2 with grace already
  // used. Reset to 1 and clear grace.
  return {
    version: STREAK_STORE_VERSION,
    currentStreak: 1,
    longestStreak: Math.max(prev.longestStreak, 1),
    lastVisitDay: now.localDay,
    lastVisitZone: now.zone,
    lastVisitAtUtcMs: now.utcMs,
    graceUsedForCurrentStreak: false,
  }
}
