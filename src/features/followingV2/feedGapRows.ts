import {type QueryKey} from '@tanstack/react-query'

import {
  type FeedPage,
  type FeedPostSlice,
  type FollowingGapOutcome,
} from '#/state/queries/post-feed'
import {findFeedGaps, type PageGap} from '#/state/queries/post-feed-boundary'
import {type AnalyticsContextType} from '#/analytics'
import {isFollowingRestorationEnabled} from './eligibility'

/**
 * Whether a feed slice renders nothing: one by a blocked or muted author,
 * until the feed is next fetched without it. The Following-to-Discover
 * fallback marker always renders.
 */
export function isFeedSliceHidden(
  slice: FeedPostSlice,
  blockedOrMutedAuthors: readonly string[],
) {
  return (
    !slice.isFallbackMarker &&
    slice.items.some(item =>
      blockedOrMutedAuthors.includes(item.post.author.did),
    )
  )
}

export type FeedGapRow = {
  type: 'followingGap'
  /** The same whether the gap is open or filled. */
  key: string
  gap: PageGap
}

/**
 * The rows that mark gaps in a feed, by the index of the page each follows -
 * see `findFeedGaps`. Only restored Following has them: for any other feed
 * this is empty, whatever its pages look like.
 */
export function feedGapRows({
  ax,
  queryKey,
  pages,
  pageParams,
  blockedOrMutedAuthors,
}: {
  ax: Pick<AnalyticsContextType, 'features'>
  queryKey: QueryKey
  pages: readonly Pick<FeedPage, 'cursor' | 'since' | 'slices'>[]
  pageParams: readonly unknown[]
  blockedOrMutedAuthors: readonly string[]
}): Map<number, FeedGapRow> {
  const rows = new Map<number, FeedGapRow>()
  if (!isFollowingRestorationEnabled(ax, queryKey)) {
    return rows
  }
  const gaps = findFeedGaps(pages, pageParams, pageIndex =>
    pages[pageIndex].slices.some(
      slice => !isFeedSliceHidden(slice, blockedOrMutedAuthors),
    ),
  )
  for (const [pageIndex, gap] of gaps) {
    rows.set(pageIndex, {
      type: 'followingGap',
      key: `followingGap-${gap.since}-${gap.cursor}`,
      gap,
    })
  }
  return rows
}

/**
 * Whether a gap row is still where filling it may land: at least part of it
 * at or below the top of the list the reader can see, so that the reader has
 * not scrolled on into the posts below it that the fill would replace. It
 * also means the list anchors on the row or above it, never on a row the fill
 * removes.
 *
 * The top the reader can see is below the header, or wherever the row's own
 * top was when it was pressed, if higher: the header may have scrolled away.
 * It is never above the top of the list. A row that cannot be measured, as one
 * the list has unmounted, is not in view.
 *
 * Positions are in window coordinates.
 */
export function isGapRowInView({
  row,
  listTop,
  headerOffset,
  pressedTop,
}: {
  row: {y: number; height: number} | undefined
  listTop: number | undefined
  headerOffset: number
  /** Where the row's top was when it was pressed, if that was measured. */
  pressedTop?: number
}) {
  if (!row || listTop === undefined) {
    return false
  }
  const visibleTop = Math.max(
    listTop,
    Math.min(listTop + headerOffset, pressedTop ?? listTop + headerOffset),
  )
  return row.y + row.height > visibleTop
}

/** The state of a gap row's own press - see `FollowingGapRow`. */
export type GapRowStatus = 'idle' | 'filling' | 'failed'

/**
 * What a gap row shows once the fill it started settles.
 *
 * - `filled`: still loading. The gap is filled by now, so the row renders
 *   nothing, or goes, as soon as the feed's rows catch up with the write.
 *   Going back to idle first would offer "Show more posts" again meanwhile.
 * - `failed`: nothing was written, so the row offers to try again.
 * - `superseded`: nothing was written, as there was nothing to fill, the pages
 *   were replaced, or the reader had scrolled on past the row. If the row is
 *   still there, it is ready to be pressed again.
 */
export function gapRowStatusAfterFill({
  outcome,
}: FollowingGapOutcome): GapRowStatus {
  switch (outcome) {
    case 'filled':
      return 'filling'
    case 'failed':
      return 'failed'
    case 'superseded':
      return 'idle'
  }
}
