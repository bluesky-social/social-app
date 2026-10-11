import {useEffect, useRef} from 'react'
import {useQueryClient} from '@tanstack/react-query'

import {isNetworkError} from '#/lib/strings/errors'
import {type AnalyticsContextType, type Metrics} from '#/analytics'
import {IS_INTERNAL} from '#/env'
import {
  type FollowingSnapshotLoad,
  takeFollowingSnapshotLoad,
} from './queries/followingSnapshot'
import {
  type GapFillOutcome,
  type PrependCheck,
  type PrependOutcome,
  type PrependTrigger,
  type RefreshOutcome,
  type SettleOutcome,
} from './queries/postFeed'
import {type NewPostsCheckTrigger} from './useNewPostsCheck'

/** Where the event happened. Only Home Following, for now. */
export type FollowingV2Surface = 'homeFollowing'

/**
 * How a check for new posts ended: what its prepend did (see `PrependCheck`),
 * or:
 *
 * - `found`: nothing to stage above (such as an empty feed), but the peek
 *   found newer posts.
 * - `failed`: it couldn't tell.
 */
export type FollowingV2CheckOutcome =
  PrependCheck['outcome'] | 'found' | 'failed'

/**
 * Share of processes reporting interval- and hop-triggered events: all
 * internal builds, 10% otherwise.
 */
export const RECURRING_SAMPLE_RATE = IS_INTERNAL ? 1 : 0.1

/** Whether this process reports recurring events, decided once. */
const isRecurringSampled = Math.random() < RECURRING_SAMPLE_RATE

/** 1 for restore, focus and return, else {@link RECURRING_SAMPLE_RATE}. */
function sampleRateOf(trigger: PrependTrigger) {
  return trigger === 'restore' || trigger === 'focus' || trigger === 'return'
    ? 1
    : RECURRING_SAMPLE_RATE
}

/** Whether this process reports events sampled at `sampleRate`. */
function isSampled(sampleRate: number) {
  return sampleRate >= 1 || isRecurringSampled
}

/**
 * The restore event for `load`: `restored` if the view's top page is the one
 * the read restored, `fetched` if not, `failed` without one.
 */
export function restoreEvent(
  load: FollowingSnapshotLoad,
  topFetchedAt: number | undefined,
): Metrics['followingV2:restore'] {
  return {
    outcome:
      topFetchedAt === undefined
        ? 'failed'
        : topFetchedAt === load.topFetchedAt
          ? 'restored'
          : 'fetched',
    snapshot: load.snapshot,
    rejectionReason: load.rejectionReason,
    ageMs: load.ageMs,
    bytes: load.bytes,
    pageCount: load.pageCount,
  }
}

/**
 * The callbacks that report a feed view's checks, prepends, refreshes, gap
 * fills and settles, which do nothing unless `enabled`.
 */
export function followingV2Reporters({
  enabled,
  metric,
}: {
  enabled: boolean
  metric: AnalyticsContextType['metric']
}) {
  return {
    onPrepend: (prepend: PrependOutcome) => {
      const sampleRate = sampleRateOf(prepend.trigger)
      if (enabled && isSampled(sampleRate)) {
        metric('followingV2:prepend', {
          trigger: prepend.trigger,
          outcome: prepend.outcome,
          postCount: prepend.postCount,
          isReplacing: prepend.isReplacing,
          isFull: prepend.isFull,
          isNetworkError: prepend.isNetworkError,
          sampleRate,
        })
      }
    },
    /**
     * Called as a check for `trigger` starts, with when the clock was set.
     * Returns what reports how it ended, and with what error.
     */
    onCheck: (trigger: NewPostsCheckTrigger, freshAt: number) => {
      const at = Date.now()
      return (outcome: FollowingV2CheckOutcome, error?: unknown) => {
        const sampleRate = sampleRateOf(trigger)
        if (enabled && isSampled(sampleRate)) {
          metric('followingV2:check', {
            surface: 'homeFollowing',
            trigger,
            outcome,
            lastSuccessAgeMs: Math.max(0, at - freshAt),
            isNetworkError:
              error === undefined ? undefined : isNetworkError(error),
            sampleRate,
          })
        }
      }
    },
    onRefresh: (refresh: RefreshOutcome) => {
      if (enabled) {
        metric('followingV2:refresh', {
          outcome: refresh.outcome,
          isNetworkError: refresh.isNetworkError,
        })
      }
    },
    /** Reports how a gap fill ended, and passes it on. */
    onGapFill: (outcome: GapFillOutcome) => {
      if (enabled) {
        metric('followingV2:gapFill', {outcome})
      }
      return outcome
    },
    onSettled: (settle: SettleOutcome | undefined) => {
      if (enabled && settle) {
        metric('followingV2:settle', {
          outcome: settle.outcome,
          droppedPageCount: settle.droppedPageCount,
        })
      }
    },
  }
}

/**
 * Following v2 metrics for one feed view, reported only when `enabled`.
 * Reports the snapshot restore once the feed has a top page or fails, and
 * returns callbacks for checks, prepends, refreshes, gap fills and settles.
 */
export function useFollowingV2Metrics({
  enabled,
  metric,
  topFetchedAt,
  isError,
}: {
  enabled: boolean
  metric: AnalyticsContextType['metric']
  /** The `fetchedAt` of the feed's top page, if it has one. */
  topFetchedAt: number | undefined
  /** Whether the feed failed to load. */
  isError: boolean
}) {
  const queryClient = useQueryClient()
  const hasReportedRestore = useRef(false)

  useEffect(() => {
    if (
      !enabled ||
      hasReportedRestore.current ||
      (topFetchedAt === undefined && !isError)
    ) {
      return
    }
    hasReportedRestore.current = true
    const load = takeFollowingSnapshotLoad(queryClient)
    if (load) {
      metric('followingV2:restore', restoreEvent(load, topFetchedAt))
    }
  }, [enabled, topFetchedAt, isError, metric, queryClient])

  return followingV2Reporters({enabled, metric})
}
