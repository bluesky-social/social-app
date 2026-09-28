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
 * Where an item sits in the Following timeline's sort order: the time of the
 * repost for a repost, otherwise the time the post was indexed.
 */
export function feedSortTime(item: app.bsky.feed.defs.FeedViewPost) {
  const reason = item.reason as {indexedAt?: unknown} | undefined
  return typeof reason?.indexedAt === 'string'
    ? reason.indexedAt
    : item.post.indexedAt
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
