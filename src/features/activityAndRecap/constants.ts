/**
 * Tuning knobs for the Activity & Recap feature. Consolidated so product
 * can reason about all bounds/limits in one place.
 */

/** Ring-buffer cap for daily follower snapshots (~5 weeks). */
export const MAX_FOLLOWER_SNAPSHOTS = 35

/** Cap on persisted dismissed weekIds. */
export const MAX_DISMISSED_RECAP_WEEKS = 8

/**
 * UTC monotonic guard: block streak increment unless at least 20h have
 * passed since the last recorded visit. Prevents "tz hop to increment"
 * abuse. (A5)
 */
export const STREAK_UTC_MONOTONIC_GUARD_MS = 20 * 60 * 60 * 1000

/**
 * Contiguous foreground dwell required to qualify as a "visit". Default
 * per ambiguity Q_A1_dwell: contiguous, not cumulative. (A1)
 */
export const STREAK_QUALIFYING_DWELL_MS = 30 * 1000

/** Streak indicator hides below this value. (A4, G4) */
export const STREAK_INDICATOR_MIN = 2

/** Recap card auto-hides this long after first render. (B6) */
export const RECAP_CARD_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

/** Recap card becomes available at or after this local time on Monday. (B1) */
export const RECAP_CARD_MONDAY_SHOW_HOUR_LOCAL = 6

/** Past recaps surfaces this many prior ISO weeks. (B5) */
export const PAST_RECAPS_WINDOW = 4

/** Hard cap on getAuthorFeed pagination for the weekly recap. (R3) */
export const WEEKLY_RECAP_MAX_PAGES = 6

/** Page size for getAuthorFeed. */
export const WEEKLY_RECAP_PAGE_LIMIT = 50

/** Auto-retry budget per weekIso per wall-clock hour. (B8) */
export const WEEKLY_RECAP_AUTO_RETRY_BUDGET = 2

/** Budget window size. (B8) */
export const WEEKLY_RECAP_AUTO_RETRY_WINDOW_MS = 60 * 60 * 1000

/**
 * Zero-posts copy for the recap. EXACT STRING per B4 — do not reword.
 * Used directly as a translation source message.
 */
export const RECAP_ZERO_POSTS_COPY = 'No posts this week — that’s fine.'
