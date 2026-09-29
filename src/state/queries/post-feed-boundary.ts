import {type app} from '#/lexicons'

/**
 * The page fields that describe where a Following page sits in the timeline.
 * Kept structural so it works on cached and serialized pages alike.
 */
export type BoundaryPage<Item = app.bsky.feed.defs.FeedViewPost> = {
  cursor: string | undefined
  startCursor?: string
  since?: string
  feed: Item[]
}

/**
 * Whether a page requested with `since` came back with its whole range: the
 * server echoes `since` as the cursor once a bounded range is exhausted.
 */
export function isExhaustedSincePage(page: BoundaryPage<unknown>) {
  return page.since !== undefined && page.cursor === page.since
}

/**
 * What lies between a page fetched with `since` whose range was not exhausted
 * (a `gap` page, see {@link classifySincePage}) and the page below it:
 *
 * - `open`: the page below does not continue from the upper page's cursor, so
 *   the posts between them are missing. Filling the gap fetches from there.
 * - `filled`: the page below is the one that continues from that cursor, so
 *   nothing is missing any more.
 *
 * `undefined` for any other page, which has nothing missing below it: an
 * exhausted `since` page ends where the page below starts, and an ordinary
 * page is continued by the one below. Also for a `since` page without a
 * cursor, which gives nothing to fetch the missing posts from.
 *
 * `lowerParam` is the page param of the page below.
 */
export function gapBelow(
  upper: Pick<BoundaryPage<unknown>, 'cursor' | 'since'>,
  lowerParam: unknown,
): 'open' | 'filled' | undefined {
  // An exhausted page echoes its `since` as its cursor.
  if (
    upper.since === undefined ||
    upper.cursor === undefined ||
    upper.cursor === upper.since
  ) {
    return undefined
  }
  const continues =
    typeof lowerParam === 'object' &&
    lowerParam !== null &&
    (lowerParam as {cursor?: unknown}).cursor === upper.cursor
  return continues ? 'filled' : 'open'
}

/**
 * A gap below one of a feed's pages, identified by that page's `since` and
 * cursor, which stay the same whatever is added above it.
 */
export type PageGap = {
  since: string
  cursor: string
  status: 'open' | 'filled'
}

/**
 * The gaps to mark in a feed, by the index of the page each is below - see
 * {@link gapBelow}.
 *
 * An open gap with no rows between it and an open gap above it (the pages
 * between them render nothing) is left out: they would read as one, and
 * filling the upper one replaces everything below it, the lower one included.
 * `hasRows` says whether the page at an index renders any rows.
 */
export function findFeedGaps(
  pages: readonly Pick<BoundaryPage<unknown>, 'cursor' | 'since'>[],
  pageParams: readonly unknown[],
  hasRows: (pageIndex: number) => boolean,
): Map<number, PageGap> {
  const gaps = new Map<number, PageGap>()
  /** Whether the last row so far is the row of an open gap. */
  let isBelowOpenGap = false
  for (let index = 0; index < pages.length - 1; index++) {
    const page = pages[index]
    if (hasRows(index)) {
      isBelowOpenGap = false
    }
    const status = gapBelow(page, pageParams[index + 1])
    if (status === undefined || (status === 'open' && isBelowOpenGap)) {
      continue
    }
    gaps.set(index, {since: page.since!, cursor: page.cursor!, status})
    isBelowOpenGap = status === 'open'
  }
  return gaps
}

/**
 * Whether `lower`, a page fetched from the top rather than continued from a
 * cursor, directly follows `upper`: `upper` is an exhausted `since` page whose
 * bound is exactly where `lower` starts.
 */
export function isContiguousAbove(
  upper: BoundaryPage<unknown>,
  lower: BoundaryPage<unknown>,
) {
  return (
    isExhaustedSincePage(upper) &&
    lower.startCursor !== undefined &&
    upper.since === lower.startCursor
  )
}

/**
 * Where an item sits in the Following timeline's sort order, in milliseconds
 * since the epoch. Compare these rather than the raw strings, which can write
 * the same time in different formats.
 *
 * The appview sorts a record by the earlier of its `createdAt` and when it was
 * indexed. So a post sorts at the earlier of its record's `createdAt` and its
 * `indexedAt`: a backdated post sorts at its `createdAt`, and a post dated in
 * the future at when it was indexed. A `createdAt` that is not a valid date is
 * ignored, as the production appview ignores it.
 *
 * A repost sorts the same way by its own record, but the client only has the
 * repost's `reason.indexedAt`, not that record's `createdAt`. For a repost
 * this is therefore an upper bound of the server's sort time, which may be
 * earlier. That is good enough for {@link carryBoundary}, the only caller that
 * needs exact times: a wrong time only matters within a run of items sharing
 * the boundary's sort time to the millisecond, which is rare; the first item
 * at a boundary is carried whatever its time; and an item carried that did not
 * need to be is harmless, as the feed's ordinary deduplication removes it.
 */
export function feedSortTime(item: app.bsky.feed.defs.FeedViewPost) {
  const reason = item.reason as {indexedAt?: unknown} | undefined
  if (typeof reason?.indexedAt === 'string') {
    return Date.parse(reason.indexedAt)
  }
  const indexedAt = Date.parse(item.post.indexedAt)
  const {createdAt} = item.post.record
  const created = typeof createdAt === 'string' ? Date.parse(createdAt) : NaN
  return Number.isNaN(created) ? indexedAt : Math.min(created, indexedAt)
}

/**
 * Returns `upper` with the boundary of `lower` copied onto its end, for when
 * `lower` is about to be dropped from below it.
 *
 * An exhausted `since` page's cursor is the bound it was requested with, which
 * points at the first post of the page below it. The server bounds on sort
 * time alone, so continuing from that cursor skips every post sharing that
 * time. Holding them on the upper page lets it continue correctly without the
 * page below. A copy that duplicates a post already rendered is removed by the
 * feed's ordinary deduplication.
 *
 * Returns `upper` itself when there is nothing to carry: a gapped `since` page
 * already continues into the range it did not return, and a page that `lower`
 * does not directly follow has no boundary with it. Never mutates either page.
 *
 * Shared by the Following snapshot selection and the settlement at the top of
 * the feed (APP-3170).
 */
export function carryBoundary<
  Page extends BoundaryPage<app.bsky.feed.defs.FeedViewPost>,
>(upper: Page, lower: BoundaryPage<app.bsky.feed.defs.FeedViewPost>): Page {
  if (!isContiguousAbove(upper, lower) || lower.feed.length === 0) {
    return upper
  }
  const boundaryTime = feedSortTime(lower.feed[0])
  let end = 1
  while (
    end < lower.feed.length &&
    feedSortTime(lower.feed[end]) === boundaryTime
  ) {
    end++
  }
  return {...upper, feed: [...upper.feed, ...lower.feed.slice(0, end)]}
}

/**
 * What identifies a feed item: the post, and for a repost who reposted it.
 * The same post reposted by two people is two items.
 */
export function feedItemKey(item: app.bsky.feed.defs.FeedViewPost) {
  const reason = item.reason as {by?: {did?: unknown}} | undefined
  const repostedBy = typeof reason?.by?.did === 'string' ? reason.by.did : ''
  return `${repostedBy}|${item.post.uri}`
}

/**
 * How a page fetched with `since` joins onto the top page it was bounded by.
 *
 * - `empty`: nothing newer, so there is no page to add.
 * - `contiguous`: the server echoed `since` back, so the whole range down to
 *   the top page is in hand.
 * - `overlap`: the page ran on into posts the top page holds, as a page from
 *   an appview that ignores `since` does. Those are cut off, and the page then
 *   meets the top page exactly, so it is shaped as a contiguous one.
 * - `gap`: the range was not exhausted and the page does not reach the top
 *   page, so there are posts missing between them.
 */
export type SinceSeam = 'empty' | 'contiguous' | 'overlap' | 'gap'

/**
 * Classifies a page fetched with `since` against the top page it was bounded
 * by, and returns the page to add above it, if any.
 *
 * Every response is checked for an overlap as a safety net: a run of items at
 * the end of the page that the top page already holds is cut off. It has to
 * be the whole end of the page, so that a lone duplicate - the copy of the
 * user's own post that their PDS served before the appview indexed it - does
 * not pass for one. Duplicates that remain are dropped by the feed's own
 * deduplication, since the page is tuned after the pages below it.
 *
 * A page that is not empty is kept even if nothing on it will render once
 * moderated: it still carries the newest server boundary.
 */
export function classifySincePage<
  Page extends BoundaryPage<app.bsky.feed.defs.FeedViewPost> & {since: string},
>(
  page: Page,
  top: BoundaryPage<app.bsky.feed.defs.FeedViewPost>,
): {seam: SinceSeam; page?: Page} {
  const topKeys = new Set(top.feed.map(feedItemKey))
  let start = page.feed.length
  while (start > 0 && topKeys.has(feedItemKey(page.feed[start - 1]))) {
    start--
  }
  const overlaps = start < page.feed.length
  const feed = overlaps ? page.feed.slice(0, start) : page.feed
  if (feed.length === 0) {
    return {seam: 'empty'}
  }
  if (isExhaustedSincePage(page)) {
    return {seam: 'contiguous', page: overlaps ? {...page, feed} : page}
  }
  if (overlaps) {
    // `since` is the top page's own server boundary, so this is not a cursor
    // made up by the client: the page now ends exactly where that one starts.
    return {seam: 'overlap', page: {...page, feed, cursor: page.since}}
  }
  return {seam: 'gap', page}
}

/**
 * The order to tune a feed's pages in: the order they were fetched, which puts
 * a page added above the others after them.
 *
 * Tuning drops a post, or a thread, that an earlier page already showed, so
 * whatever the reader has already seen keeps its rows, and a page's rows never
 * change because of something fetched below it later. Ties go to the higher
 * page, which is fetch order for pages fetched in one pass.
 */
export function tuneOrder(pages: readonly {fetchedAt: number}[]): number[] {
  return pages
    .map((page, index) => ({fetchedAt: page.fetchedAt, index}))
    .sort((a, b) => a.fetchedAt - b.fetchedAt || a.index - b.index)
    .map(entry => entry.index)
}
