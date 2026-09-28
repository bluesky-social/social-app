import {Client, jsonToLex, type JsonValue, lexToJson} from '@atproto/lex'
import {hashKey, type InfiniteData, type QueryKey} from '@tanstack/react-query'
import {type PersistedClient} from '@tanstack/react-query-persist-client'

import {type app} from '#/lexicons'
import {type FeedPageUnselected} from './post-feed'
import {
  carryBoundary,
  isContiguousAbove,
  isExhaustedSincePage,
} from './post-feed-boundary'

/*
 * The Following persistence policy: which query is written to disk, what of it
 * is kept, and what a restored snapshot must satisfy before it is hydrated.
 * Everything here works on copies; the live cache is never changed.
 */

/**
 * Whether a valid Following snapshot is hydrated on a cold start.
 *
 * Off until the restore prepend (APP-3167) lands, which switches it on. On its
 * own a restored snapshot would be a stale top with nothing newer above it,
 * since feeds never go stale by time. While off, snapshots are still written
 * and validated on restore (and the outcome reported), then dropped, so
 * Following cold-loads as it always has.
 */
export const FOLLOWING_SNAPSHOT_RESTORE_ENABLED = false

/**
 * The version of the snapshot format, bumped on any breaking change to it.
 * Separate from the app-version buster, which busts the whole persisted cache.
 */
export const FOLLOWING_SNAPSHOT_VERSION = 1
export const FOLLOWING_SNAPSHOT_MAX_PAGES = 3
export const FOLLOWING_SNAPSHOT_MAX_BYTES = 1024 * 1024
export const FOLLOWING_SNAPSHOT_MAX_PAGE_AGE_MS = 24 * 60 * 60 * 1000

/**
 * The one query that is persisted: Home's Following feed, unmerged. Spelled
 * out rather than built with `RQKEY` so that the persister does not load the
 * whole feed module; a test checks that the two agree.
 */
export const FOLLOWING_SNAPSHOT_QUERY_KEY: QueryKey = [
  'post-feed',
  'following',
  {mergeFeedEnabled: false, mergeFeedSources: []},
]
export const FOLLOWING_SNAPSHOT_QUERY_HASH = hashKey(
  FOLLOWING_SNAPSHOT_QUERY_KEY,
)

/**
 * `preferencesQueryKey`, and the key `useMyLabelersQuery` reads the labelers
 * for a set of DIDs from: the moderation inputs a restored snapshot needs
 * hydrated alongside it, so that it is never rendered without them. Spelled out
 * for the same reason as the Following key; the tests build their fixtures
 * with the real ones.
 */
const PREFERENCES_QUERY_KEY: QueryKey = [
  'getPreferences',
  {},
  {persistedVersion: 1},
]
function labelersQueryKey(dids: string[]): QueryKey {
  return ['labelers-detailed-info', {dids}, {persistedVersion: 1}]
}

/** `FALLBACK_MARKER_POST.post.uri`, the Following-to-Discover fallback. */
const FALLBACK_MARKER_URI = 'fallback-marker-post'

export type FollowingSnapshotRejection =
  /** Following v2 is not enabled for this session. */
  | 'ineligible'
  /** Written for another account. */
  | 'account'
  /** Written in another snapshot format. */
  | 'version'
  /** Pages or page params are not the shape a Following page has. */
  | 'shape'
  /** A cursor or page param does not continue the page above it. */
  | 'cursor'
  /** No page has a `startCursor`: the server does not support `since`. */
  | 'noStartCursor'
  /** Holds the Following-to-Discover fallback. */
  | 'fallback'
  /** Over the byte budget, even with only the top page. */
  | 'tooLarge'
  /** The top page, or on restore any page, is older than a day. */
  | 'expired'
  /** Could not keep an exhausted `since` page with a correct boundary. */
  | 'boundary'
  /** The moderation inputs were not persisted with it. */
  | 'moderation'
  /** Something threw. */
  | 'error'

/**
 * A page either continues the cursor of the page above it, or starts a chain
 * of its own with no param: a fetch from the top, and a page fetched with
 * `since` above one, which records its bound on itself.
 */
type SnapshotPageParam = {cursor: string} | undefined

type SerializedPage = {
  cursor?: string
  startCursor?: string
  since?: string
  fetchedAt: number
  feed: JsonValue[]
}

/** What the Following query's data is replaced with on disk. */
export type FollowingSnapshot = {
  followingSnapshotVersion: number
  did: string
  pages: SerializedPage[]
  /** JSON has no `undefined`, so a top page's param is written as `null`. */
  pageParams: Array<Exclude<SnapshotPageParam, undefined> | null>
}

export type FollowingSnapshotStats = {
  pageCount: number
  bytes: number
  /** Age of the top page, which the restore resumes at. */
  ageMs: number
  /** Age of the oldest retained page. */
  oldestPageAgeMs: number
}

export type FollowingRestoreReport =
  | {outcome: 'absent'}
  | {outcome: 'rejected'; reason: FollowingSnapshotRejection}
  | ({outcome: 'disabled' | 'restored'} & FollowingSnapshotStats)

type Result<T> =
  {ok: true; value: T} | {ok: false; reason: FollowingSnapshotRejection}

/*
 * Saving
 */

/**
 * Replaces the Following query in a client about to be written to disk with
 * its snapshot, or leaves it out when there should not be one. Every other
 * query is passed through untouched, and so is the client when it holds no
 * Following query.
 */
export function prepareFollowingSnapshotForSave(
  client: PersistedClient,
  {
    did,
    isEligible,
    now = Date.now(),
    onRejected,
  }: {
    did: string | undefined
    isEligible: () => boolean
    now?: number
    onRejected?: (reason: FollowingSnapshotRejection) => void
  },
): PersistedClient {
  const index = findFollowingQuery(client)
  if (index === -1) {
    return client
  }
  let snapshot: FollowingSnapshot | undefined
  if (did && isEligible()) {
    let result: Result<FollowingSnapshot>
    try {
      result = selectFollowingSnapshot(
        client.clientState.queries[index].state.data,
        did,
        now,
      )
    } catch {
      result = {ok: false, reason: 'error'}
    }
    if (result.ok) {
      snapshot = result.value
    } else {
      onRejected?.(result.reason)
    }
  }
  return replaceFollowingQuery(client, index, snapshot)
}

/**
 * Chooses what of the Following query's data to keep: the newest intact pages,
 * at most {@link FOLLOWING_SNAPSHOT_MAX_PAGES} of them and
 * {@link FOLLOWING_SNAPSHOT_MAX_BYTES} serialized, dropping whole pages from
 * the bottom. When the kept page at the bottom is an exhausted `since` page,
 * the boundary of the page dropped below it is carried onto it.
 */
export function selectFollowingSnapshot(
  data: unknown,
  did: string,
  now: number,
): Result<FollowingSnapshot> {
  if (!isInfiniteData(data)) {
    return {ok: false, reason: 'shape'}
  }
  const {pages, pageParams} = data
  const first = checkPage(pages[0], now)
  if (first) {
    return {ok: false, reason: first}
  }
  if (!isHeadParam(pageParams[0])) {
    return {ok: false, reason: 'cursor'}
  }

  // The intact prefix: fresh, fallback-free pages that each continue the last.
  let intact = 1
  while (
    intact < Math.min(pages.length, FOLLOWING_SNAPSHOT_MAX_PAGES) &&
    !checkPage(pages[intact], now) &&
    isLinked(pages[intact - 1], pages[intact], pageParams[intact])
  ) {
    intact++
  }
  let reason: FollowingSnapshotRejection = 'tooLarge'
  for (let count = intact; count >= 1; count--) {
    const kept = pages.slice(0, count)
    const bottom = kept[count - 1]
    const below = pages[count] as FeedPageUnselected | undefined
    if (below !== undefined && isExhaustedSincePage(bottom)) {
      /*
       * Its range ends where the page below starts, so that page's boundary
       * is carried onto it - and only from a page that could have been kept
       * itself, so that a carry never makes stale posts look freshly fetched.
       */
      if (checkPage(below, now) || !isContiguousAbove(bottom, below)) {
        reason = 'boundary'
        continue
      }
      kept[count - 1] = carryBoundary(bottom, below)
    }
    if (!kept.some(page => page.startCursor !== undefined)) {
      reason = 'noStartCursor'
      continue
    }
    const snapshot: FollowingSnapshot = {
      followingSnapshotVersion: FOLLOWING_SNAPSHOT_VERSION,
      did,
      pages: kept.map(serializePage),
      // Each checked by `isHeadParam` or `isLinked` above.
      pageParams: pageParams
        .slice(0, count)
        .map(param =>
          param === undefined
            ? null
            : (param as Exclude<SnapshotPageParam, undefined>),
        ),
    }
    if (snapshotBytes(snapshot) > FOLLOWING_SNAPSHOT_MAX_BYTES) {
      reason = 'tooLarge'
      continue
    }
    return {ok: true, value: snapshot}
  }
  return {ok: false, reason}
}

/*
 * Restoring
 */

/**
 * Validates the Following snapshot in a client read back from disk, and turns
 * it back into the query's data when it may be hydrated. Otherwise the query is
 * left out, so Following cold-loads, and every other query is hydrated as
 * usual. Never throws.
 */
export function restoreFollowingSnapshot(
  client: PersistedClient,
  {
    did,
    isEligible,
    now = Date.now(),
    isRestoreEnabled = FOLLOWING_SNAPSHOT_RESTORE_ENABLED,
  }: {
    did: string | undefined
    isEligible: () => boolean
    now?: number
    isRestoreEnabled?: boolean
  },
): {client: PersistedClient; report?: FollowingRestoreReport} {
  const index = findFollowingQuery(client)
  if (index === -1) {
    return {
      client,
      report: did && isEligible() ? {outcome: 'absent'} : undefined,
    }
  }
  let result: Result<{
    data: InfiniteData<FeedPageUnselected, SnapshotPageParam>
    stats: FollowingSnapshotStats
  }>
  try {
    result =
      did && isEligible()
        ? validateFollowingSnapshot(client, index, did, now)
        : {ok: false, reason: 'ineligible'}
  } catch {
    result = {ok: false, reason: 'error'}
  }
  if (!result.ok) {
    return {
      client: replaceFollowingQuery(client, index, undefined),
      report: {outcome: 'rejected', reason: result.reason},
    }
  }
  if (!isRestoreEnabled) {
    return {
      client: replaceFollowingQuery(client, index, undefined),
      report: {outcome: 'disabled', ...result.value.stats},
    }
  }
  const queries = [...client.clientState.queries]
  const query = queries[index]
  queries[index] = {
    ...query,
    state: {
      ...query.state,
      data: result.value.data,
      // An invalidated query would be refetched from the top on mount.
      isInvalidated: false,
    },
  }
  return {
    client: {...client, clientState: {...client.clientState, queries}},
    report: {outcome: 'restored', ...result.value.stats},
  }
}

function validateFollowingSnapshot(
  client: PersistedClient,
  index: number,
  did: string,
  now: number,
): Result<{
  data: InfiniteData<FeedPageUnselected, SnapshotPageParam>
  stats: FollowingSnapshotStats
}> {
  const snapshot = client.clientState.queries[index].state.data
  if (!isRecord(snapshot)) {
    return {ok: false, reason: 'shape'}
  }
  if (snapshot.followingSnapshotVersion !== FOLLOWING_SNAPSHOT_VERSION) {
    return {ok: false, reason: 'version'}
  }
  if (snapshot.did !== did) {
    return {ok: false, reason: 'account'}
  }
  const {pages, pageParams} = snapshot
  if (
    !Array.isArray(pages) ||
    !Array.isArray(pageParams) ||
    pages.length === 0 ||
    pages.length > FOLLOWING_SNAPSHOT_MAX_PAGES ||
    pages.length !== pageParams.length ||
    !pages.every(isSerializedPage)
  ) {
    return {ok: false, reason: 'shape'}
  }
  const params = pageParams.map(param =>
    param === null ? undefined : (param as unknown),
  )
  if (!isHeadParam(params[0])) {
    return {ok: false, reason: 'cursor'}
  }
  for (let i = 1; i < pages.length; i++) {
    if (!isLinked(pages[i - 1], pages[i], params[i])) {
      return {ok: false, reason: 'cursor'}
    }
  }
  if (pages.some(hasFallbackMarker)) {
    return {ok: false, reason: 'fallback'}
  }
  if (!pages.some(page => page.startCursor !== undefined)) {
    return {ok: false, reason: 'noStartCursor'}
  }
  const bytes = snapshotBytes(snapshot as FollowingSnapshot)
  if (bytes > FOLLOWING_SNAPSHOT_MAX_BYTES) {
    return {ok: false, reason: 'tooLarge'}
  }
  const ages = pages.map(page => now - page.fetchedAt)
  if (ages.some(age => age > FOLLOWING_SNAPSHOT_MAX_PAGE_AGE_MS)) {
    return {ok: false, reason: 'expired'}
  }
  if (!hasModerationInputs(client)) {
    return {ok: false, reason: 'moderation'}
  }

  return {
    ok: true,
    value: {
      data: {
        pages: pages.map(deserializePage),
        pageParams: params as SnapshotPageParam[],
      },
      stats: {
        pageCount: pages.length,
        bytes,
        ageMs: ages[0],
        oldestPageAgeMs: Math.max(...ages),
      },
    },
  }
}

/**
 * Whether the client holds the preferences, and the labelers those
 * preferences subscribe to, both fetched successfully.
 */
function hasModerationInputs(client: PersistedClient) {
  const hashes = new Set(
    client.clientState.queries
      .filter(query => query.state.status === 'success')
      .map(query => query.queryHash),
  )
  const preferences = client.clientState.queries.find(
    query => query.queryHash === hashKey(PREFERENCES_QUERY_KEY),
  )?.state.data
  if (!hashes.has(hashKey(PREFERENCES_QUERY_KEY)) || !isRecord(preferences)) {
    return false
  }
  const moderationPrefs = preferences.moderationPrefs
  const labelers = isRecord(moderationPrefs) ? moderationPrefs.labelers : []
  if (!Array.isArray(labelers)) {
    return false
  }
  // As `useMyLabelersQuery` builds them.
  const dids = Array.from(
    new Set<string>(
      [
        ...Client.appLabelers,
        ...labelers.map(labeler =>
          isRecord(labeler) ? labeler.did : undefined,
        ),
      ].filter((did): did is string => typeof did === 'string'),
    ),
  )
  return hashes.has(hashKey(labelersQueryKey(dids)))
}

/*
 * Pages
 */

/**
 * Why a page cannot be kept, if it cannot: the reasons that stop the intact
 * prefix at it, or reject the snapshot when it is the top page.
 */
function checkPage(
  page: unknown,
  now: number,
): FollowingSnapshotRejection | undefined {
  if (!isPage(page)) {
    return 'shape'
  }
  if (hasFallbackMarker(page)) {
    return 'fallback'
  }
  if (now - page.fetchedAt > FOLLOWING_SNAPSHOT_MAX_PAGE_AGE_MS) {
    return 'expired'
  }
}

/**
 * Whether a page's param is the one a page that starts a chain has: none, for
 * a fetch from the top and for a page fetched with `since` above one alike.
 */
function isHeadParam(param: unknown): param is undefined {
  return param === undefined
}

/**
 * Whether `lower` carries on from `upper` with nothing missing between them.
 *
 * An ordinary page continues the cursor of the page above it. Below an
 * exhausted `since` page there is a page fetched from the top instead, which
 * must start exactly where that page's range ended. A cursor continued from
 * an exhausted page's echo would have skipped the posts at its boundary.
 */
function isLinked(
  upper: FeedPageUnselected | SerializedPage,
  lower: FeedPageUnselected | SerializedPage,
  lowerParam: unknown,
) {
  if (isExhaustedSincePage(asBoundaryPage(upper))) {
    return (
      isHeadParam(lowerParam) &&
      isContiguousAbove(asBoundaryPage(upper), asBoundaryPage(lower))
    )
  }
  return (
    lower.since === undefined &&
    isRecord(lowerParam) &&
    Object.keys(lowerParam).length === 1 &&
    typeof lowerParam.cursor === 'string' &&
    lowerParam.cursor === upper.cursor
  )
}

function asBoundaryPage(page: FeedPageUnselected | SerializedPage) {
  return {
    cursor: page.cursor,
    startCursor: page.startCursor,
    since: page.since,
    feed: page.feed,
  }
}

function hasFallbackMarker(page: {feed: unknown[]}) {
  return page.feed.some(
    item =>
      isRecord(item) &&
      isRecord(item.post) &&
      item.post.uri === FALLBACK_MARKER_URI,
  )
}

function serializePage(page: FeedPageUnselected): SerializedPage {
  return {
    ...(page.cursor !== undefined && {cursor: page.cursor}),
    ...(page.startCursor !== undefined && {startCursor: page.startCursor}),
    ...(page.since !== undefined && {since: page.since}),
    fetchedAt: page.fetchedAt,
    /*
     * The client decoded these from lex JSON, so they hold CIDs and bytes that
     * plain JSON would not bring back.
     */
    feed: lexToJson(page.feed) as JsonValue[],
  }
}

function deserializePage(page: SerializedPage): FeedPageUnselected {
  return {
    cursor: page.cursor,
    ...(page.startCursor !== undefined && {startCursor: page.startCursor}),
    ...(page.since !== undefined && {since: page.since}),
    // Parsed the way the client parses responses.
    feed: jsonToLex(page.feed, {
      strict: false,
    }) as unknown as app.bsky.feed.defs.FeedViewPost[],
    fetchedAt: page.fetchedAt,
  }
}

/** The size of a snapshot as it is written to disk, in bytes. */
function snapshotBytes(snapshot: FollowingSnapshot) {
  return utf8ByteLength(JSON.stringify(snapshot))
}

/** The length of a string once encoded as UTF-8, which is what is stored. */
export function utf8ByteLength(value: string) {
  let bytes = 0
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i)
    if (code < 0x80) {
      bytes += 1
    } else if (code < 0x800) {
      bytes += 2
    } else if (code >= 0xd800 && code <= 0xdbff && i + 1 < value.length) {
      // A surrogate pair is one four-byte character.
      bytes += 4
      i++
    } else {
      bytes += 3
    }
  }
  return bytes
}

/*
 * Shapes
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isOptionalString(value: unknown) {
  return value === undefined || typeof value === 'string'
}

function isInfiniteData(
  data: unknown,
): data is InfiniteData<FeedPageUnselected, unknown> {
  return (
    isRecord(data) &&
    Array.isArray(data.pages) &&
    Array.isArray(data.pageParams) &&
    data.pages.length > 0 &&
    data.pages.length === data.pageParams.length
  )
}

function isPage(page: unknown): page is FeedPageUnselected {
  return (
    isRecord(page) &&
    isOptionalString(page.cursor) &&
    isOptionalString(page.startCursor) &&
    isOptionalString(page.since) &&
    typeof page.fetchedAt === 'number' &&
    Number.isFinite(page.fetchedAt) &&
    Array.isArray(page.feed)
  )
}

function isSerializedPage(page: unknown): page is SerializedPage {
  return (
    isPage(page) &&
    (page.feed as unknown[]).every(
      item =>
        isRecord(item) &&
        isRecord(item.post) &&
        typeof item.post.uri === 'string',
    )
  )
}

/**
 * Where the Following query is in the client, or -1. A client read back from
 * disk may not be well formed, and that is TanStack's to handle as it always
 * has, so this never throws on one.
 */
function findFollowingQuery(client: PersistedClient) {
  const queries: unknown = client?.clientState?.queries
  if (!Array.isArray(queries)) {
    return -1
  }
  return queries.findIndex(
    query =>
      isRecord(query) && query.queryHash === FOLLOWING_SNAPSHOT_QUERY_HASH,
  )
}

/**
 * The client with the Following query's data swapped for `data`, or without
 * the query at all when there is none. A copy: the client passed in, whose
 * queries refer to the live cache's data, is not changed.
 */
function replaceFollowingQuery(
  client: PersistedClient,
  index: number,
  data: FollowingSnapshot | undefined,
): PersistedClient {
  const queries = [...client.clientState.queries]
  if (data === undefined) {
    queries.splice(index, 1)
  } else {
    queries[index] = {
      ...queries[index],
      state: {...queries[index].state, data},
    }
  }
  return {...client, clientState: {...client.clientState, queries}}
}
