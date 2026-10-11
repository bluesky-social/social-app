import {useEffect, useRef} from 'react'

import {isNetworkError} from '#/lib/strings/errors'
import {type AnalyticsContextType, type Metrics} from '#/analytics'
import {IS_INTERNAL} from '#/env'
import {
  type FollowingSnapshotLoad,
  takeFollowingSnapshotLoad,
} from './queries/followingSnapshot'
import {
  gapBelow,
  type GapFillOutcome,
  type PostFeedData,
  type PrependOutcome,
  type PrependTrigger,
  PROCESS_STARTED_AT,
  type RefreshOutcome,
  type StagedPage,
} from './queries/postFeed'
import {type NewPostsCheckTrigger} from './useNewPostsCheck'

/*
 * Following v2's metrics: how restores, checks, prepends, gap fills, settles
 * and refreshes turn out on native Home Following. They report counts, ages,
 * sizes, enums and booleans only, never feed content, cursors or account
 * data.
 */

/**
 * Where a check happens. Only Home's Following feed checks this way so far;
 * other surfaces join as they gain checks.
 */
export type FollowingV2Surface = 'homeFollowing'

/**
 * How a check for new posts ended:
 *
 * - `staged`: it put newer posts above the reader.
 * - `notStaged`: it fetched newer posts but put none of them above the
 *   reader. The `followingV2:prepend` metric says why.
 * - `nothing`: nothing was newer.
 * - `found`: with no boundary to fetch above, as for an empty feed, it found
 *   newer posts, and refreshed or lit the Home dot.
 * - `skipped`: what's staged is already full, so it made no request.
 * - `joined`: a prepend already in flight, or owed to a restored top, answered
 *   it.
 * - `failed`: it couldn't tell.
 */
export type FollowingV2CheckOutcome =
  'staged' | 'notStaged' | 'nothing' | 'found' | 'skipped' | 'joined' | 'failed'

/**
 * The share of processes that report events which can recur every minute or
 * more often, such as the checks of an interval or a quick hop away and back,
 * and their prepends: every process in internal builds, a tenth otherwise.
 * Each event carries its rate, to weigh it by.
 */
export const RECURRING_SAMPLE_RATE = IS_INTERNAL ? 1 : 0.1

/** Whether this process reports recurring events, decided once. */
const isRecurringSampled = Math.random() < RECURRING_SAMPLE_RATE

/**
 * The sample rate of the events of something `trigger` started. A restore, a
 * focus and a significant return are rare enough to report every time.
 * Anything else, an interval or a `hop`, can recur every minute or more often,
 * so it's sampled (see {@link RECURRING_SAMPLE_RATE}).
 */
export function sampleRateOf(trigger: PrependTrigger) {
  return trigger === 'restore' || trigger === 'focus' || trigger === 'return'
    ? 1
    : RECURRING_SAMPLE_RATE
}

/** Whether this process reports events sampled at `sampleRate`. */
function isSampled(sampleRate: number) {
  return sampleRate >= 1 || isRecurringSampled
}

/**
 * The `followingV2:restore` event for what the read of the persisted client
 * found, `load`, once the feed's top page has been fetched at `topFetchedAt`,
 * or has failed to load if there's none.
 */
export function restoreEvent(
  load: FollowingSnapshotLoad,
  topFetchedAt: number | undefined,
): Metrics['followingV2:restore'] {
  return {
    outcome:
      topFetchedAt === undefined
        ? 'failed'
        : topFetchedAt < PROCESS_STARTED_AT
          ? 'restored'
          : 'fetched',
    ...load,
  }
}

/**
 * How a check ended (see {@link FollowingV2CheckOutcome}), from what it
 * resolved to and what the view was doing.
 */
export function checkOutcome({
  found,
  prepend,
  wasOwed,
  wasStagedFull,
}: {
  /** Whether it resolved to a find. */
  found: boolean
  /** How the prepend it started ended, if it started one. */
  prepend: PrependOutcome['outcome'] | undefined
  /** Whether the restore's prepend was in flight or owed as it started. */
  wasOwed: boolean
  /** Whether what's staged was full as it started. */
  wasStagedFull: boolean
}): FollowingV2CheckOutcome {
  if (wasOwed) {
    return 'joined'
  }
  if (prepend === 'staged') {
    return 'staged'
  }
  if (prepend !== undefined && prepend !== 'empty') {
    return 'notStaged'
  }
  if (found) {
    return 'found'
  }
  if (prepend === undefined && wasStagedFull) {
    return 'skipped'
  }
  return 'nothing'
}

/**
 * Whether `staged` is still the top page and full, so a check of it makes no
 * request.
 */
export function isStagedFull(
  staged: StagedPage | undefined,
  pages: readonly {fetchedAt: number}[] | undefined,
) {
  return !!staged?.isFull && pages?.[0]?.fetchedAt === staged.fetchedAt
}

/**
 * The `followingV2:settle` event for a settle of `before` that `wrote` or
 * didn't, or `undefined` if there was no open gap to cut it at, so there was
 * nothing to write.
 */
export function settleEvent(
  before: PostFeedData | undefined,
  wrote: boolean,
): Metrics['followingV2:settle'] | undefined {
  const index =
    before?.pages.findIndex((_, i) => gapBelow(before.pages, i) === 'open') ??
    -1
  if (!before || index === -1) {
    return undefined
  }
  return wrote
    ? {outcome: 'settled', droppedPageCount: before.pages.length - index - 1}
    : {outcome: 'superseded', droppedPageCount: 0}
}

/**
 * Following v2's metrics for one view of a feed, which only native Home
 * Following reports (`enabled`). It reports what the last read of the
 * persisted client found of the Following snapshot once the feed first has a
 * top page or fails to load, and hands out reporters for the view's checks,
 * prepends, refreshes, gap fills and settles to call. Disabled, the reporters
 * do nothing but pass on what they're given.
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
  const hasReportedRestore = useRef(false)
  /**
   * How many prepends have ended, and how the last one did, for a check to
   * tell whether it started one.
   */
  const prepends = useRef<{count: number; last?: PrependOutcome['outcome']}>({
    count: 0,
  })

  useEffect(() => {
    if (
      !enabled ||
      hasReportedRestore.current ||
      (topFetchedAt === undefined && !isError)
    ) {
      return
    }
    hasReportedRestore.current = true
    const load = takeFollowingSnapshotLoad()
    if (load) {
      metric('followingV2:restore', restoreEvent(load, topFetchedAt))
    }
  }, [enabled, topFetchedAt, isError, metric])

  return {
    /** For `usePostFeedPrepend`'s `onOutcome`. */
    onPrepend: (outcome: PrependOutcome) => {
      prepends.current = {
        count: prepends.current.count + 1,
        last: outcome.outcome,
      }
      const sampleRate = sampleRateOf(outcome.trigger)
      if (enabled && isSampled(sampleRate)) {
        metric('followingV2:prepend', {...outcome, sampleRate})
      }
    },
    /**
     * Makes a wrapper for a view's `check`, as `useNewPostsCheck` takes it,
     * that reports each check. `isOwed` and `isStagedFull` say what the view
     * was doing as a check starts.
     */
    checkReporter:
      ({
        isOwed,
        isStagedFull,
      }: {
        isOwed: () => boolean
        isStagedFull: () => boolean
      }) =>
      <T>(check: (trigger: NewPostsCheckTrigger) => Promise<T>) =>
      async (trigger: NewPostsCheckTrigger, {freshAt}: {freshAt: number}) => {
        if (!enabled) {
          return check(trigger)
        }
        const at = Date.now()
        const wasOwed = isOwed()
        const wasStagedFull = isStagedFull()
        const prependCount = prepends.current.count
        const report = (outcome: FollowingV2CheckOutcome, error?: unknown) => {
          const sampleRate = sampleRateOf(trigger)
          if (isSampled(sampleRate)) {
            metric('followingV2:check', {
              surface: 'homeFollowing',
              trigger,
              outcome,
              lastSuccessAgeMs: Math.max(0, at - freshAt),
              ...(error !== undefined && {
                isNetworkError: isNetworkError(error),
              }),
              sampleRate,
            })
          }
        }
        try {
          const result = await check(trigger)
          report(
            checkOutcome({
              found: !!result,
              prepend:
                prepends.current.count !== prependCount
                  ? prepends.current.last
                  : undefined,
              wasOwed,
              wasStagedFull,
            }),
          )
          return result
        } catch (e) {
          report('failed', e)
          throw e
        }
      },
    /** For `usePostFeedRefresh`'s `onOutcome`. */
    onRefresh: (outcome: RefreshOutcome) => {
      if (enabled) {
        metric('followingV2:refresh', outcome)
      }
    },
    /** Reports how a gap fill ended, and passes it on. */
    onGapFill: (outcome: GapFillOutcome) => {
      if (enabled) {
        metric('followingV2:gapFill', {outcome})
      }
      return outcome
    },
    /** For `useSettleAtTop`'s `onSettled`. */
    onSettled: (before: PostFeedData | undefined, wrote: boolean) => {
      const event = settleEvent(before, wrote)
      if (enabled && event) {
        metric('followingV2:settle', event)
      }
    },
  }
}
