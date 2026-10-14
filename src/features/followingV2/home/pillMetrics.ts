import {useEffect, useRef} from 'react'

import {newPostsPillPresentation} from '#/components/NewPostsPill/presentation'
import {type AnalyticsContextType} from '#/analytics'
import {type FollowingV2Surface} from './metrics'
import {
  type PrependPillHideReason,
  type PrependPillSource,
  type usePrependPill,
} from './usePrependPill'

const SURFACE: FollowingV2Surface = 'homeFollowing'

/** How the pill shows its posts: a facepile, or an arrow and a count. */
export type PrependPillPresentation = 'facepile' | 'generic'

/** How the pill presents `count` posts with `faceCount` faces to show. */
function prependPillPresentation(
  count: number,
  faceCount: number,
): PrependPillPresentation {
  return newPostsPillPresentation({variant: 'newPosts', count, faceCount}) ===
    'facepile'
    ? 'facepile'
    : 'generic'
}

/** One offer, from the pill going up to it coming down. */
type Offer = {
  source: PrependPillSource
  /** When it first showed, if it has. */
  shownAt?: number
  /** The count when it last showed. */
  count: number
  presentation: PrependPillPresentation
}

/**
 * Reports the impression, press and coming down of each offer of `pill` that
 * shows, only when `enabled`. It shows only while the view is active, so an
 * offer that comes down unseen reports nothing.
 */
export function usePrependPillMetrics({
  enabled,
  metric,
  pill,
}: {
  enabled: boolean
  metric: AnalyticsContextType['metric']
  pill: Pick<
    ReturnType<typeof usePrependPill>,
    'isUp' | 'visible' | 'count' | 'authors' | 'source' | 'hideReason'
  >
}) {
  const offer = useRef<Offer>(undefined)
  const presentation = prependPillPresentation(pill.count, pill.authors.length)

  useEffect(() => {
    if (!enabled) {
      return
    }
    if (pill.isUp && !offer.current && pill.source) {
      offer.current = {source: pill.source, count: pill.count, presentation}
    }
    const current = offer.current
    if (!current) {
      return
    }
    if (pill.visible) {
      current.count = pill.count
      current.presentation = presentation
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
      if (current.shownAt === undefined) {
        return
      }
      const reason: PrependPillHideReason = pill.hideReason ?? 'gone'
      const shownMs = Date.now() - current.shownAt
      // A press takes it down, so it's reported as it comes down.
      if (reason === 'pressed') {
        metric('followingV2:pill:press', {
          surface: SURFACE,
          source: current.source,
          count: current.count,
          presentation: current.presentation,
          shownMs,
        })
      }
      metric('followingV2:pill:hide', {
        surface: SURFACE,
        source: current.source,
        reason,
        count: current.count,
        shownMs,
      })
    }
  }, [
    enabled,
    metric,
    pill.isUp,
    pill.visible,
    pill.count,
    pill.source,
    pill.hideReason,
    presentation,
  ])
}
