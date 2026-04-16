/**
 * Types for the Activity & Recap feature (ticket i9KLo7kw).
 *
 * All persisted shapes are versioned and stored in Account-scoped MMKV
 * (tier 3). See `storage.ts` for reads/writes and `constants.ts` for
 * bounds / tuning knobs.
 */

export const STREAK_STORE_VERSION = 1

/**
 * Account-scoped streak state. Missing means "never visited".
 */
export type StreakStore = {
  /** Schema version for forward-compat */
  version: typeof STREAK_STORE_VERSION
  /** 0 after fresh install / post-reset */
  currentStreak: number
  /** High-water mark, never decreases */
  longestStreak: number
  /** 'YYYY-MM-DD' in `lastVisitZone` */
  lastVisitDay: string
  /** IANA tz, e.g. 'America/New_York' (A5) */
  lastVisitZone: string
  /** UTC epoch ms — the monotonic guard anchor (A5) */
  lastVisitAtUtcMs: number
  /** Set true when we forgive exactly 1 missed day (A3, G2) */
  graceUsedForCurrentStreak: boolean
}

/**
 * One per-day snapshot of the follower count. Ring-buffered in account
 * MMKV; size bounded by `MAX_FOLLOWER_SNAPSHOTS`.
 */
export type FollowerSnapshot = {
  /** 'YYYY-MM-DD' local day */
  day: string
  /** `followersCount` from getProfile at capture time */
  count: number
}

/**
 * Consolidated activity & recap preferences + dismissals.
 * Per-account (AC-X2) via MMKV scoped by DID.
 */
export type ActivityAndRecapPrefs = {
  /** AC-X1: default true. When false, StreakIndicator hides. */
  showStreak?: boolean
  /** AC-X1: default true. When false, WeeklyRecapCard hides and query never fires (B11). */
  showRecap?: boolean
  /** ISO week IDs (e.g. '2026-W15'). Bounded via `MAX_DISMISSED_RECAP_WEEKS`. */
  dismissedRecapWeekIds?: string[]
  /** weekIso -> UTC ms of first render. Used for B6 auto-expiry. */
  recapCardFirstShown?: Record<string, number>
}

/**
 * Weekly recap payload cached in TanStack Query (tier 4).
 *
 * Only `{uri, cid}` is persisted for `topPost` — the Recap screen re-fetches
 * the full post so it inherits moderation filtering at render time (B10).
 */
export type WeeklyRecap = {
  /** 'YYYY-Www' */
  weekIso: string
  /** ISO datetime, Monday 00:00 local */
  windowStart: string
  /** ISO datetime, Sunday 23:59:59 local */
  windowEnd: string
  /**
   * Single combined count of posts authored in the window
   * (originals + self-replies + self-reposts). See Q_B2_posts default.
   */
  postsCount: number
  /** `max(0, end - start)` snapshot delta (B4) */
  followerDelta: number
  /** Null when moderation fallback has been exhausted (B10). */
  topPost: {uri: string; cid: string} | null
  /**
   * Additional ranked candidates used for moderation fallback at render
   * time (B10). Not shown to the user; only consumed by the Recap screen.
   */
  topPostCandidates: {uri: string; cid: string}[]
  fetchedAtUtcMs: number
}

/**
 * Pure-function day/time input; constructed from `Date.now()` at call site.
 * Exposes the monotonic UTC anchor, the IANA tz, and the resolved local
 * YYYY-MM-DD for that tz.
 */
export type NowInput = {
  utcMs: number
  zone: string
  localDay: string
}
