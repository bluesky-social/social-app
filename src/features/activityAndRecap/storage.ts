/**
 * Account-scoped storage wrapper for the Activity & Recap feature.
 *
 * All reads/writes go through the `account` Storage<> instance exported
 * from `#/storage` — never the raw MMKV (ARCHITECTURE.md §5 Rule).
 * Defensive reads apply a version guard for `StreakStore`; mismatched
 * versions are handled at the reducer boundary (see computeNextStreak).
 */

import {
  MAX_DISMISSED_RECAP_WEEKS,
  MAX_FOLLOWER_SNAPSHOTS,
} from '#/features/activityAndRecap/constants'
import {
  type ActivityAndRecapPrefs,
  type FollowerSnapshot,
  STREAK_STORE_VERSION,
  type StreakStore,
} from '#/features/activityAndRecap/types'
import {account} from '#/storage'

/* ---------- Streak ---------- */

export function readStreak(did: string): StreakStore | undefined {
  const value = account.get([did, 'streak'])
  if (!value) return undefined
  if (value.version !== STREAK_STORE_VERSION) {
    // Version mismatch is handled by the reducer (defensive reset on next visit).
    return value
  }
  return value
}

export function writeStreak(did: string, next: StreakStore): void {
  account.set([did, 'streak'], next)
}

/* ---------- Follower snapshots (ring buffer) ---------- */

export function readFollowerSnapshots(did: string): FollowerSnapshot[] {
  return account.get([did, 'followerSnapshots']) ?? []
}

/**
 * Append a snapshot; if an entry for the same day already exists, replace
 * it. Trim to `MAX_FOLLOWER_SNAPSHOTS` entries (drop oldest).
 */
export function upsertFollowerSnapshot(
  did: string,
  snapshot: FollowerSnapshot,
): void {
  const existing = readFollowerSnapshots(did)
  const without = existing.filter(s => s.day !== snapshot.day)
  const next = [...without, snapshot].sort((a, b) => a.day.localeCompare(b.day))
  const trimmed =
    next.length > MAX_FOLLOWER_SNAPSHOTS
      ? next.slice(next.length - MAX_FOLLOWER_SNAPSHOTS)
      : next
  account.set([did, 'followerSnapshots'], trimmed)
}

/* ---------- Prefs (toggles + dismissals + firstShown) ---------- */

export function readPrefs(did: string): ActivityAndRecapPrefs {
  return account.get([did, 'activityAndRecap']) ?? {}
}

export function writePrefs(did: string, prefs: ActivityAndRecapPrefs): void {
  account.set([did, 'activityAndRecap'], prefs)
}

/** Merge a patch into the prefs blob. Caller-friendly. */
export function patchPrefs(
  did: string,
  patch: Partial<ActivityAndRecapPrefs>,
): ActivityAndRecapPrefs {
  const prev = readPrefs(did)
  const next: ActivityAndRecapPrefs = {...prev, ...patch}
  writePrefs(did, next)
  return next
}

export function dismissRecapWeek(did: string, weekIso: string): void {
  const prev = readPrefs(did)
  const ids = new Set(prev.dismissedRecapWeekIds ?? [])
  ids.add(weekIso)
  // Bound the set; keep the most recent `MAX_DISMISSED_RECAP_WEEKS`
  // (lexicographic comparison works for 'YYYY-Www').
  const sorted = Array.from(ids).sort()
  const trimmed =
    sorted.length > MAX_DISMISSED_RECAP_WEEKS
      ? sorted.slice(sorted.length - MAX_DISMISSED_RECAP_WEEKS)
      : sorted
  writePrefs(did, {...prev, dismissedRecapWeekIds: trimmed})
}

export function isRecapWeekDismissed(did: string, weekIso: string): boolean {
  return !!readPrefs(did).dismissedRecapWeekIds?.includes(weekIso)
}

export function markRecapCardFirstShown(
  did: string,
  weekIso: string,
  utcMs: number,
): void {
  const prev = readPrefs(did)
  const map = {...(prev.recapCardFirstShown ?? {})}
  if (!map[weekIso]) {
    map[weekIso] = utcMs
    writePrefs(did, {...prev, recapCardFirstShown: map})
  }
}

export function getRecapCardFirstShown(
  did: string,
  weekIso: string,
): number | undefined {
  return readPrefs(did).recapCardFirstShown?.[weekIso]
}

/* ---------- Cleanup (AC-A10) ---------- */

/**
 * Remove ALL Activity & Recap state for a given DID. Called by
 * `removeAccount` in the session reducer (S21).
 *
 * Co-exported from the feature root via `clearActivityAndRecapDataForDid.ts`.
 */
export function clearAllForDid(did: string): void {
  account.remove([did, 'streak'])
  account.remove([did, 'followerSnapshots'])
  account.remove([did, 'activityAndRecap'])
}
