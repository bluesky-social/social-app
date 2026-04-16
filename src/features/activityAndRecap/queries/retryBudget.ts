/**
 * Per-weekIso auto-retry budget (AC-B8).
 *
 * TanStack Query's `retry` option alone is insufficient because it resets
 * on remount. We wrap the queryFn with this budget gate so the 2-per-hour
 * auto-retry limit survives re-mounts. Manual "Try again" bypasses.
 *
 * Backed by an in-memory map; no MMKV persistence in v0 (cheaper and
 * sufficient for anti-flap).
 */

import {
  WEEKLY_RECAP_AUTO_RETRY_BUDGET,
  WEEKLY_RECAP_AUTO_RETRY_WINDOW_MS,
} from '#/features/activityAndRecap/constants'

type Bucket = {
  windowStart: number
  retries: number
}

const buckets = new Map<string, Bucket>()

/**
 * Returns true if this attempt is within budget; increments the counter.
 * Call only on auto-retry paths. Manual retry paths skip this gate.
 *
 * @param weekIso e.g. '2026-W15'
 * @param now   default `Date.now()` — injectable for tests
 */
export function tryAutoRetry(
  weekIso: string,
  now: number = Date.now(),
): boolean {
  const bucket = buckets.get(weekIso)
  if (
    !bucket ||
    now - bucket.windowStart >= WEEKLY_RECAP_AUTO_RETRY_WINDOW_MS
  ) {
    buckets.set(weekIso, {windowStart: now, retries: 1})
    return true
  }
  if (bucket.retries >= WEEKLY_RECAP_AUTO_RETRY_BUDGET) {
    return false
  }
  bucket.retries += 1
  return true
}

/** Reset the retry bucket for a weekIso. Called on successful fetch. */
export function resetAutoRetry(weekIso: string): void {
  buckets.delete(weekIso)
}

/** For tests. */
export function __resetAllForTests(): void {
  buckets.clear()
}
