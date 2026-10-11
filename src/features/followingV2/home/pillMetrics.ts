import {useEffect, useRef} from 'react'

import {useOnAppReturnedFromBackground} from '#/lib/appState'
import {newPostsPillPresentation} from '#/components/NewPostsPill/presentation'
import {type AnalyticsContextType} from '#/analytics'
import {type FollowingV2Surface} from './metrics'

/*
 * Metrics for the new posts pill on native Home Following (see
 * `usePrependPill`): when it shows, when it's pressed, and why it comes down.
 * Counts, durations and enums only, never the posts or their authors.
 */

/** Where the pill is. */
const SURFACE: FollowingV2Surface = 'homeFollowing'

/** What put the pill up: a restore, or a significant return to the app. */
export type PrependPillSource = 'restore' | 'return'

/** How the pill shows its posts: a facepile, or an arrow and a count. */
export type PrependPillPresentation = 'facepile' | 'generic'

/**
 * Why the pill came down:
 *
 * - `reachedTop`: the reader reached the true top.
 * - `pressed`: the reader pressed it.
 * - `replaced`: a refresh, or another fetch from the top, replaced the feed.
 * - `gone`: none of its posts render any more, as after a deletion, a mute or
 *   a block.
 */
export type PrependPillHideReason =
  'reachedTop' | 'pressed' | 'replaced' | 'gone'

/** How the pill presents `count` posts with `faceCount` faces to show. */
export function prependPillPresentation(
  count: number,
  faceCount: number,
): PrependPillPresentation {
  return newPostsPillPresentation({variant: 'newPosts', count, faceCount}) ===
    'facepile'
    ? 'facepile'
    : 'generic'
}

/**
 * Why the pill came down without the reader reaching the top or pressing it:
 * `replaced` if the feed's top page now is one fetched from the top (it has
 * no `since`) after the pill went up at `upAt`, otherwise `gone`.
 */
export function prependPillGoneReason(
  top: {fetchedAt?: number; since?: string},
  upAt: number,
): PrependPillHideReason {
  return top.fetchedAt !== undefined &&
    top.since === undefined &&
    top.fetchedAt >= upAt
    ? 'replaced'
    : 'gone'
}

/** The parts of `usePrependPill` that its metrics read and wrap. */
type Pill = {
  isUp: boolean
  visible: boolean
  count: number
  authors: readonly unknown[]
  dismiss: () => void
  onPress: () => void
}

/** The pill from going up to coming down, once it has shown. */
type Offer = {
  source: PrependPillSource
  upAt: number
  /** When it first showed, if it has. */
  shownAt?: number
  /** As it last showed. */
  count: number
  /** Why it's coming down, once the reader has made it. */
  hideReason?: PrependPillHideReason
}

/**
 * Reports `pill`'s impressions, presses and comings-down, which only native
 * Home Following does (`enabled`), and returns it with `dismiss` and
 * `onPress` wrapped to tell why it comes down.
 *
 * An impression is the first time an offer shows, which is only while the
 * view is active: an offer that comes down without showing reports nothing.
 * What put an offer up is a significant return to the app if one came while
 * the view was active before it went up, as only a restore and a significant
 * return offer posts, and a restore comes first.
 */
export function usePrependPillMetrics<P extends Pill>({
  enabled,
  metric,
  isActive,
  top,
  pill,
}: {
  enabled: boolean
  metric: AnalyticsContextType['metric']
  /** Whether the view is the one on screen. */
  isActive: boolean
  /** The feed's top page, if it has one. */
  top: {fetchedAt: number; since?: string} | undefined
  pill: P
}): P {
  const offer = useRef<Offer>(undefined)
  const hasSignificantReturn = useRef(false)
  useOnAppReturnedFromBackground(() => {
    if (isActive) {
      hasSignificantReturn.current = true
    }
  })

  const presentation = prependPillPresentation(pill.count, pill.authors.length)
  const topFetchedAt = top?.fetchedAt
  const topSince = top?.since
  useEffect(() => {
    if (!enabled) {
      return
    }
    if (pill.isUp && !offer.current) {
      offer.current = {
        source: hasSignificantReturn.current ? 'return' : 'restore',
        upAt: Date.now(),
        count: pill.count,
      }
    }
    const current = offer.current
    if (!current) {
      return
    }
    if (pill.visible) {
      current.count = pill.count
      if (current.shownAt === undefined) {
        current.shownAt = Date.now()
        metric('followingV2:pill:impression', {
          surface: SURFACE,
          source: current.source,
          count: current.count,
          presentation,
        })
      }
    }
    if (!pill.isUp) {
      offer.current = undefined
      if (current.shownAt !== undefined) {
        metric('followingV2:pill:hide', {
          surface: SURFACE,
          source: current.source,
          reason:
            current.hideReason ??
            prependPillGoneReason(
              {fetchedAt: topFetchedAt, since: topSince},
              current.upAt,
            ),
          count: current.count,
          shownMs: Date.now() - current.shownAt,
        })
      }
    }
  }, [
    enabled,
    metric,
    pill.isUp,
    pill.visible,
    pill.count,
    presentation,
    topFetchedAt,
    topSince,
  ])

  return {
    ...pill,
    dismiss: () => {
      if (offer.current) {
        offer.current.hideReason ??= 'reachedTop'
      }
      pill.dismiss()
    },
    onPress: () => {
      const current = offer.current
      if (enabled && current?.shownAt !== undefined) {
        current.hideReason ??= 'pressed'
        metric('followingV2:pill:press', {
          surface: SURFACE,
          source: current.source,
          count: pill.count,
          presentation,
          shownMs: Date.now() - current.shownAt,
        })
      }
      pill.onPress()
    },
  }
}
