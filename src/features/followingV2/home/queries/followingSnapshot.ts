import {jsonToLex, type JsonValue, lexToJson, utf8Len} from '@atproto/lex'
import {hashKey} from '@tanstack/react-query'
import {type PersistedClient} from '@tanstack/react-query-persist-client'

import {IS_NATIVE} from '#/env'
import {type app} from '#/lexicons'
import {type FeedPageUnselected, type PostFeedData} from './postFeed'

/*
 * Following v2 persists one query, the fork's Home Following feed, through the
 * account's query persister: not all of its pages, but a snapshot of the
 * newest few. This is the policy for what goes in a snapshot and what a
 * snapshot must be to be read back. It only ever works on copies, so the live
 * cache is never changed.
 */

/**
 * Whether a valid snapshot is hydrated on a cold start. Off until the restore
 * prepend lands: until then a snapshot is written but dropped when it's read
 * back, so Following cold-loads as it always has.
 */
const FOLLOWING_SNAPSHOT_RESTORE_ENABLED = false

/**
 * Bumped on any breaking change to the snapshot format. Separate from the
 * app-version buster, which drops the whole persisted cache.
 */
export const FOLLOWING_SNAPSHOT_VERSION = 1
export const FOLLOWING_SNAPSHOT_MAX_PAGES = 3
export const FOLLOWING_SNAPSHOT_MAX_BYTES = 1024 * 1024

/**
 * The fork's Home Following query, `RQKEY('following')`. Spelled out so the
 * persister doesn't load the feed query module; a test checks they agree.
 */
export const FOLLOWING_SNAPSHOT_QUERY_KEY = ['post-feed', 'v2|following', {}]
const FOLLOWING_SNAPSHOT_QUERY_HASH = hashKey(FOLLOWING_SNAPSHOT_QUERY_KEY)

/** A page as it's written to disk. */
type SnapshotPage = Omit<FeedPageUnselected, 'feed'> & {feed: JsonValue[]}

/** What the Following query's data is replaced with on disk. */
export type FollowingSnapshot = {
  version: number
  pages: SnapshotPage[]
  /** JSON has no `undefined`, so the top page's param reads back as `null`. */
  pageParams: Array<PostFeedData['pageParams'][number] | null>
}

/**
 * Whether the persister should dehydrate this query because it's the one
 * Following v2 persists. Following v2 is native-only, so never on web.
 */
export function isFollowingSnapshotQuery(query: {queryHash: string}) {
  return IS_NATIVE && query.queryHash === FOLLOWING_SNAPSHOT_QUERY_HASH
}

/**
 * The client to write to disk, with the Following query's data replaced by its
 * snapshot, or the query left out if none of it can be kept. A client without
 * the query is returned as it is.
 */
export function saveFollowingSnapshot(client: PersistedClient) {
  return replaceFollowingData(client, data =>
    selectFollowingSnapshot(data as PostFeedData),
  )
}

/**
 * The client read back from disk, with the Following snapshot turned back into
 * the query's data if it's valid and restoring is on. Otherwise the query is
 * left out, so Following cold-loads. Every other query is hydrated as usual.
 */
export function loadFollowingSnapshot(
  client: PersistedClient,
  {restore = FOLLOWING_SNAPSHOT_RESTORE_ENABLED}: {restore?: boolean} = {},
) {
  return replaceFollowingData(client, data =>
    restore ? readFollowingSnapshot(data) : undefined,
  )
}

/**
 * The newest whole pages of the Following query's data that make a valid
 * snapshot: at most {@link FOLLOWING_SNAPSHOT_MAX_PAGES} of them and
 * {@link FOLLOWING_SNAPSHOT_MAX_BYTES} serialized, stopping before the first
 * Discover page and after the first gap, and dropping whole pages from the
 * bottom. `undefined` if not even the top page makes one.
 *
 * A gapped `since` page is kept, but not the pages below it: its cursor goes
 * on into the gap, so once restored, ordinary pagination fills it. When the
 * page below an exhausted `since` page is dropped, its boundary is carried onto
 * the copy that's kept (see {@link carryBoundary}).
 */
export function selectFollowingSnapshot(
  data: PostFeedData,
): FollowingSnapshot | undefined {
  // Pages from there down are the Following-to-Discover fallback.
  const discover = data.pages.findIndex(page => page.source === 'discover')
  const gap = data.pages.findIndex(isGapped)
  const count = Math.min(
    FOLLOWING_SNAPSHOT_MAX_PAGES,
    discover === -1 ? data.pages.length : discover,
    gap === -1 ? data.pages.length : gap + 1,
  )
  const pages = data.pages.slice(0, count).map(toSnapshotPage)
  for (let kept = count; kept > 0; kept--) {
    const bottom = data.pages[kept - 1]
    const below = data.pages[kept]
    const carried = below ? carryBoundary(bottom, below) : bottom
    const snapshot = {
      version: FOLLOWING_SNAPSHOT_VERSION,
      pages: [
        ...pages.slice(0, kept - 1),
        carried === bottom ? pages[kept - 1] : toSnapshotPage(carried),
      ],
      pageParams: data.pageParams.slice(0, kept),
    }
    if (isValidFollowingSnapshot(snapshot)) {
      return snapshot
    }
  }
}

function toSnapshotPage(page: FeedPageUnselected): SnapshotPage {
  return {
    ...page,
    // The feed holds lex values, such as CIDs, that plain JSON would lose.
    feed: lexToJson(page.feed) as JsonValue[],
  }
}

/**
 * Whether `page` was requested with `since` and came back with a cursor other
 * than its echo, so there may be posts between it and the page below.
 */
function isGapped(page: FeedPageUnselected) {
  return page.since !== undefined && page.cursor !== page.since
}

/**
 * `upper` with the boundary of `lower`, the page below it, copied onto its end,
 * for when `lower` is to be dropped. Returns `upper` itself when there's
 * nothing to carry. Never changes either page.
 *
 * An exhausted `since` page's cursor is the `since` it was requested with,
 * which is where the page below it starts. The server bounds on sort time
 * alone, so carrying on from that cursor skips every post at that time:
 * `lower`'s first post and any after it with the same sort time. With those
 * on `upper`, it carries on correctly without `lower`. A copy of a post
 * already shown is dropped by the feed's ordinary deduplication.
 */
function carryBoundary(
  upper: FeedPageUnselected,
  lower: FeedPageUnselected,
): FeedPageUnselected {
  const isExhausted = upper.since !== undefined && upper.cursor === upper.since
  if (
    !isExhausted ||
    upper.since !== lower.startCursor ||
    lower.feed.length === 0
  ) {
    return upper
  }
  const boundary = feedSortTime(lower.feed[0])
  let end = 1
  while (
    end < lower.feed.length &&
    feedSortTime(lower.feed[end]) === boundary
  ) {
    end++
  }
  return {...upper, feed: [...upper.feed, ...lower.feed.slice(0, end)]}
}

/**
 * Where an item sits in the Following timeline's sort order, in milliseconds.
 * The appview sorts a post by the earlier of its record's `createdAt` and its
 * `indexedAt`, ignoring a `createdAt` that isn't a date. A repost sorts the
 * same way by its own record, but the client only has the repost's
 * `indexedAt`, which can be later. That's close enough for
 * {@link carryBoundary}: carrying a post that didn't need it does no harm.
 */
function feedSortTime(item: app.bsky.feed.defs.FeedViewPost) {
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
 * The query data a snapshot read back from disk holds, or `undefined` if it
 * isn't a valid snapshot.
 */
export function readFollowingSnapshot(
  snapshot: unknown,
): PostFeedData | undefined {
  if (!isValidFollowingSnapshot(snapshot)) {
    return
  }
  return {
    pages: snapshot.pages.map(page => ({
      ...page,
      // Not strict: this is data the client has already parsed once.
      feed: jsonToLex(
        page.feed,
      ) as unknown as app.bsky.feed.defs.FeedViewPost[],
    })),
    pageParams: snapshot.pageParams.map(param => param ?? undefined),
  }
}

/**
 * The rules for a snapshot, checked on saving and on loading: the current
 * version, one to {@link FOLLOWING_SNAPSHOT_MAX_PAGES} pages with a page param
 * each, the top one fetched from the top and every other continuing the
 * cursor of the page above, a `startCursor` on the top page (which is how we
 * know the server supports `since`), no Discover pages, and at most
 * {@link FOLLOWING_SNAPSHOT_MAX_BYTES} serialized.
 *
 * A page put above the others with `since` is fetched from the top too, and
 * the page below it continues from its cursor, so the same rules hold for it.
 */
function isValidFollowingSnapshot(
  snapshot: unknown,
): snapshot is FollowingSnapshot {
  if (!isRecord(snapshot) || snapshot.version !== FOLLOWING_SNAPSHOT_VERSION) {
    return false
  }
  const {pages, pageParams} = snapshot
  if (
    !Array.isArray(pages) ||
    !Array.isArray(pageParams) ||
    pages.length === 0 ||
    pages.length > FOLLOWING_SNAPSHOT_MAX_PAGES ||
    pages.length !== pageParams.length ||
    !pages.every(isFollowingPage) ||
    !pages[0].startCursor
  ) {
    return false
  }
  const isAligned = pageParams.every((param, i) =>
    i === 0
      ? param === undefined || param === null
      : isRecord(param) &&
        param.source === undefined &&
        typeof param.cursor === 'string' &&
        param.cursor === pages[i - 1].cursor,
  )
  return (
    isAligned &&
    utf8Len(JSON.stringify(snapshot)) <= FOLLOWING_SNAPSHOT_MAX_BYTES
  )
}

function isFollowingPage(page: unknown): page is SnapshotPage {
  return (
    isRecord(page) &&
    page.source === undefined &&
    (page.cursor === undefined || typeof page.cursor === 'string') &&
    (page.startCursor === undefined || typeof page.startCursor === 'string') &&
    (page.since === undefined || typeof page.since === 'string') &&
    typeof page.fetchedAt === 'number' &&
    Array.isArray(page.feed)
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * A copy of the client with the Following query's data swapped for what
 * `replace` returns, or without the query when that's `undefined` or it
 * throws. A client without the query, or one that isn't well formed (which is
 * TanStack's to handle), is returned as it is.
 */
function replaceFollowingData(
  client: PersistedClient,
  replace: (data: unknown) => unknown,
): PersistedClient {
  const queries: unknown = client?.clientState?.queries
  if (!Array.isArray(queries)) {
    return client
  }
  const index = queries.findIndex(
    query =>
      isRecord(query) && query.queryHash === FOLLOWING_SNAPSHOT_QUERY_HASH,
  )
  if (index === -1) {
    return client
  }
  const query = client.clientState.queries[index]
  let data: unknown
  try {
    data = replace(query.state?.data)
  } catch {
    data = undefined
  }
  return {
    ...client,
    clientState: {
      ...client.clientState,
      queries:
        data === undefined
          ? client.clientState.queries.filter((_, i) => i !== index)
          : client.clientState.queries.map((q, i) =>
              i === index ? {...query, state: {...query.state, data}} : q,
            ),
    },
  }
}
