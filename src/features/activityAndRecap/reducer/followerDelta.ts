/**
 * Pure helper for net new-followers calculation (AC-B4).
 *
 * Clamps negative deltas to 0. Degrades gracefully when a snapshot is
 * missing: uses the oldest-available snapshot as a floor; if neither end
 * of the window is present, returns 0.
 */

import {type FollowerSnapshot} from '#/features/activityAndRecap/types'

/**
 * Return a snapshot whose `day` string <= `dayIso` (latest such entry).
 * Returns undefined if none exists.
 */
function snapshotAtOrBefore(
  snapshots: readonly FollowerSnapshot[],
  dayIso: string,
): FollowerSnapshot | undefined {
  // Snapshots are not guaranteed to be sorted; sort a shallow copy once.
  const sorted = [...snapshots].sort((a, b) => a.day.localeCompare(b.day))
  let match: FollowerSnapshot | undefined
  for (const s of sorted) {
    if (s.day <= dayIso) match = s
    else break
  }
  return match
}

/**
 * Return a snapshot whose `day` string >= `dayIso` (earliest such entry).
 */
function snapshotAtOrAfter(
  snapshots: readonly FollowerSnapshot[],
  dayIso: string,
): FollowerSnapshot | undefined {
  const sorted = [...snapshots].sort((a, b) => a.day.localeCompare(b.day))
  for (const s of sorted) {
    if (s.day >= dayIso) return s
  }
  return undefined
}

/**
 * `max(0, end - start)` using snapshot ring-buffer lookup. If `startDay`
 * is not covered, we fall back to the oldest available snapshot; if
 * `endDay` is not covered, we fall back to the most recent snapshot
 * on or before `endDay`. If neither is available, returns 0.
 *
 * @param snapshots Account-scoped ring buffer.
 * @param startDay  'YYYY-MM-DD' local — Monday 00:00 of the window.
 * @param endDay    'YYYY-MM-DD' local — Sunday 23:59 of the window.
 */
export function followerDelta(
  snapshots: readonly FollowerSnapshot[] | undefined,
  startDay: string,
  endDay: string,
): number {
  if (!snapshots || snapshots.length === 0) return 0

  // Prefer an exact or earlier snapshot for the start. If none exists,
  // use the oldest available snapshot as the floor (graceful degrade).
  const startSnap =
    snapshotAtOrBefore(snapshots, startDay) ??
    snapshotAtOrAfter(snapshots, startDay)
  const endSnap =
    snapshotAtOrBefore(snapshots, endDay) ??
    snapshotAtOrAfter(snapshots, endDay)

  if (!startSnap || !endSnap) return 0

  const diff = (endSnap.count ?? 0) - (startSnap.count ?? 0)
  return Math.max(0, diff)
}
