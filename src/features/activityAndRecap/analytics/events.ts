/**
 * Typed analytics event builders for Activity & Recap (AC-B12).
 *
 * Payloads carry BOOLEANS ONLY — no counts, no URIs. This is a product
 * guardrail (B12): we use these to size the KPI dashboard without ever
 * leaking engagement numbers off-device.
 *
 * Usage:
 *   const ax = useAnalytics()
 *   ax.metric(...recapCardShown({postsCount, followerDelta, topPost}))
 */

import {type WeeklyRecap} from '#/features/activityAndRecap/types'

export function streakIndicatorShown(
  has_streak: boolean,
): ['streak:indicatorShown', {has_streak: boolean}] {
  return ['streak:indicatorShown', {has_streak}]
}

export function streakExplainerOpened(): ['streak:explainerOpened', {}] {
  return ['streak:explainerOpened', {}]
}

export function streakOptIn(): ['streak:optIn', {}] {
  return ['streak:optIn', {}]
}

export function streakOptOut(): ['streak:optOut', {}] {
  return ['streak:optOut', {}]
}

export type RecapBooleans = {
  has_posts: boolean
  has_top_post: boolean
  has_follower_delta: boolean
}

/**
 * Build a recap:cardShown payload from the full recap object, stripping
 * all numeric metrics down to booleans. Per B12.
 */
export function recapCardShown(
  recap: Pick<WeeklyRecap, 'postsCount' | 'followerDelta' | 'topPost'>,
): ['recap:cardShown', RecapBooleans] {
  return [
    'recap:cardShown',
    {
      has_posts: (recap.postsCount ?? 0) > 0,
      has_top_post: recap.topPost != null,
      has_follower_delta: (recap.followerDelta ?? 0) > 0,
    },
  ]
}

export function recapCardTapped(): ['recap:cardTapped', {}] {
  return ['recap:cardTapped', {}]
}

export function recapCardDismissed(): ['recap:cardDismissed', {}] {
  return ['recap:cardDismissed', {}]
}

export function recapOptIn(): ['recap:optIn', {}] {
  return ['recap:optIn', {}]
}

export function recapOptOut(): ['recap:optOut', {}] {
  return ['recap:optOut', {}]
}
