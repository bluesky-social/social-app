import {
  hashKey,
  type InfiniteData,
  notifyManager,
  type QueryClient,
  type QueryFilters,
  type QueryKey,
} from '@tanstack/react-query'

import {type FeedAPI} from '#/lib/api/feed/types'

/** Live feed state, kept outside serializable query data. */
export type PostFeedQueryEntry = {
  /**
   * Keyed by pages and continuation params so overlapping refresh and
   * pagination chains keep their own stateful APIs.
   */
  feedApis: WeakMap<object, FeedAPI>
  /**
   * Counts the fetches from the top of the query, whether a refresh or one
   * TanStack started itself (the first load, a refetch, an invalidation or a
   * reset). Only the latest may write, so a refresh that a newer top fetch
   * overtook never lands.
   */
  generation: number
  /**
   * The refreshes in flight. They settle together, with the outcome of the one
   * that writes, so every caller learns of the commit that served it.
   */
  refresh?: PendingRefresh
}

type PendingRefresh = {
  promise: Promise<object | undefined>
  resolve: (page: object | undefined) => void
  reject: (error: unknown) => void
}

const registries = new WeakMap<QueryClient, Map<string, PostFeedQueryEntry>>()

function getEntries(queryClient: QueryClient) {
  let entries = registries.get(queryClient)
  if (!entries) {
    const created = new Map<string, PostFeedQueryEntry>()
    queryClient.getQueryCache().subscribe(event => {
      if (event.type === 'removed') {
        // Its restore, if it had one, is over, but stays recorded.
        settlePostFeedRestore(queryClient, event.query.queryHash)
        const entry = created.get(event.query.queryHash)
        if (entry) {
          // A refresh in flight can no longer write, so it settles now.
          supersedePostFeedRefresh(entry)
          created.delete(event.query.queryHash)
        }
      }
    })
    registries.set(queryClient, created)
    entries = created
  }
  return entries
}

export function getPostFeedQueryEntry(
  queryClient: QueryClient,
  queryKey: QueryKey,
): PostFeedQueryEntry {
  const queryHash = hashKey(queryKey)
  const entries = getEntries(queryClient)
  let entry = entries.get(queryHash)
  if (!entry) {
    entry = {feedApis: new WeakMap(), generation: 0}
    // An in-flight fetch must not recreate an entry after query removal.
    if (queryClient.getQueryCache().get(queryHash)) {
      entries.set(queryHash, entry)
    }
  }
  return entry
}

export function peekPostFeedQueryEntry(
  queryClient: QueryClient,
  queryKey: QueryKey,
): PostFeedQueryEntry | undefined {
  return registries.get(queryClient)?.get(hashKey(queryKey))
}

/**
 * Overtakes any refresh of this query that is in flight: those settle without
 * writing. Called for every fetch from the top that the refresh operation does
 * not own, so that the most recently started one is what lands.
 */
export function supersedePostFeedRefresh(entry: PostFeedQueryEntry) {
  entry.generation++
  entry.refresh?.resolve(undefined)
  entry.refresh = undefined
}

/**
 * {@link supersedePostFeedRefresh} for every cached post-feed query matching
 * `filters`, for changes that make any response still in flight stale.
 */
export function supersedePostFeedRefreshes(
  queryClient: QueryClient,
  filters: QueryFilters,
) {
  const entries = registries.get(queryClient)
  for (const query of queryClient.getQueryCache().findAll(filters)) {
    settlePostFeedRestore(queryClient, query.queryHash)
    const entry = entries?.get(query.queryHash)
    if (entry) {
      supersedePostFeedRefresh(entry)
    }
  }
}

/**
 * Whether a refresh of the post-feed query with this key is in flight.
 */
export function isPostFeedRefreshing(
  queryClient: QueryClient,
  queryKey: QueryKey,
) {
  return peekPostFeedQueryEntry(queryClient, queryKey)?.refresh !== undefined
}

/**
 * Replaces a post-feed query's pages with a freshly fetched top page in a
 * single write, or leaves them untouched.
 *
 * `fetchTop` fetches the page with a new API of its own, and nothing is written
 * until it has. The page, its page param and its API are then promoted
 * together, so the next page continues with that API. A failed fetch writes
 * nothing, and the cached pages carry on paginating with theirs.
 *
 * Refreshes that overlap share one outcome. Each starts its own fetch, as a
 * TanStack refetch would, but only the latest may write, and they all settle
 * with its result: the page it wrote, or its error. A fetch from the top that
 * TanStack starts, or the query's removal, settles them without a write.
 */
export function refreshPostFeedQuery<Page extends object>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  fetchTop: () => Promise<{page: Page; api: FeedAPI}>,
): Promise<Page | undefined> {
  const entry = getPostFeedQueryEntry(queryClient, queryKey)
  const generation = ++entry.generation
  const pending = (entry.refresh ??= createPendingRefresh())
  const isLatest = () => entry.generation === generation

  void (async () => {
    try {
      const {page, api} = await fetchTop()
      if (!isLatest()) {
        return
      }
      entry.refresh = undefined
      // Also false for an entry never cached, which nothing supersedes.
      if (peekPostFeedQueryEntry(queryClient, queryKey) !== entry) {
        pending.resolve(undefined)
        return
      }
      entry.feedApis.set(page, api)
      // What was restored is replaced, so there is nothing left to follow up.
      settlePostFeedRestore(queryClient, hashKey(queryKey))
      /*
       * A fetch still in flight, such as a fetchNextPage, would land after this
       * write and put back the pages it replaces, so it is cancelled first. In
       * one batch with the write, so observers hear of both once.
       */
      notifyManager.batch(() => {
        void queryClient.cancelQueries({queryKey, exact: true})
        queryClient.setQueryData<InfiniteData<Page, unknown>>(queryKey, {
          pages: [page],
          pageParams: [undefined],
        })
      })
      pending.resolve(page)
    } catch (error) {
      if (isLatest()) {
        entry.refresh = undefined
        pending.reject(error)
      }
    }
  })()

  /*
   * Callers wait on the shared outcome rather than their own fetch, so a
   * superseded refresh settles as soon as whatever overtook it does.
   */
  return pending.promise as Promise<Page | undefined>
}

function createPendingRefresh(): PendingRefresh {
  let resolve!: PendingRefresh['resolve']
  let reject!: PendingRefresh['reject']
  const promise = new Promise<object | undefined>((res, rej) => {
    resolve = res
    reject = rej
  })
  return {promise, resolve, reject}
}

/**
 * Adds a page above a post-feed query's top page in a single write, or leaves
 * the query untouched.
 *
 * `fetchAbove` fetches the page, bounded by the top page it is handed, and
 * decides whether there is anything to add. Nothing is written until it has,
 * and then only if the top page is still the one it was bounded by: a refresh
 * or a fetch from the top that started meanwhile, or one still in flight,
 * replaces the top, and the query's removal ends it. The page starts a chain
 * of its own (its page param is `undefined`), so a TanStack refetch from the
 * first page param is an ordinary fetch from the top, never a replay of the
 * bounded one.
 *
 * `beforeCommit` runs between the fetch and the write, and everything is
 * checked again after it. The commit-at-rest gate (D2) waits there for the list
 * to stop moving.
 *
 * Rejects when `fetchAbove` does, having written nothing.
 */
export async function prependPostFeedQuery<Page extends object, Detail>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  fetchAbove: (
    top: Page,
  ) => Promise<{page?: Page; api?: FeedAPI; detail: Detail}>,
  {beforeCommit}: {beforeCommit?: () => Promise<void>} = {},
): Promise<{
  status: 'committed' | 'nothing' | 'superseded'
  detail?: Detail
}> {
  const readTop = () =>
    queryClient.getQueryData<InfiniteData<Page, unknown>>(queryKey)?.pages[0]
  const top = readTop()
  if (!top) {
    return {status: 'superseded'}
  }
  const entry = getPostFeedQueryEntry(queryClient, queryKey)
  const generation = entry.generation
  const isCurrent = () =>
    entry.generation === generation &&
    entry.refresh === undefined &&
    peekPostFeedQueryEntry(queryClient, queryKey) === entry &&
    readTop() === top

  const {page, api, detail} = await fetchAbove(top)
  if (!isCurrent()) {
    return {status: 'superseded', detail}
  }
  if (!page) {
    return {status: 'nothing', detail}
  }
  await beforeCommit?.()
  if (!isCurrent()) {
    return {status: 'superseded', detail}
  }
  if (api) {
    entry.feedApis.set(page, api)
  }
  // As in `refreshPostFeedQuery`: nothing in flight may land after this.
  notifyManager.batch(() => {
    void queryClient.cancelQueries({queryKey, exact: true})
    queryClient.setQueryData<InfiniteData<Page, unknown>>(queryKey, data =>
      data && data.pages[0] === top
        ? {
            pages: [page, ...data.pages],
            pageParams: [undefined, ...data.pageParams],
          }
        : data,
    )
  })
  return {status: 'committed', detail}
}

/**
 * Gives the top page of a post-feed query an API if it has none, as a page
 * restored from disk does, so that the feed can be peeked at for new posts.
 */
export function ensurePostFeedTopApi(
  queryClient: QueryClient,
  queryKey: QueryKey,
  createApi: () => FeedAPI,
) {
  const top =
    queryClient.getQueryData<InfiniteData<object, unknown>>(queryKey)?.pages[0]
  const entry = peekPostFeedQueryEntry(queryClient, queryKey)
  if (top && entry && !entry.feedApis.has(top)) {
    entry.feedApis.set(top, createApi())
  }
}

/**
 * A post-feed query that was restored from disk this account session, and how
 * far its follow-up has got: the fetch of what is newer than the restored top
 * (the restore prepend).
 *
 * - `pending`: restored, and not followed up yet.
 * - `prepending`: the follow-up is in flight.
 * - `settled`: followed up, or overtaken by whatever replaced the restored top
 *   (a refresh, a fetch from the top, a reset, the query's removal).
 *
 * Unlike the entries above, these are not disposed with their query: the
 * restore happened once for the session, whatever becomes of the query later.
 * They go when the account's `QueryClient` does.
 */
export type PostFeedRestore = {
  restoredAt: number
  pageCount: number
  status: 'pending' | 'prepending' | 'settled'
}

const restores = new WeakMap<QueryClient, Map<string, PostFeedRestore>>()

/**
 * Records that the query with this hash was hydrated from a snapshot.
 */
export function recordPostFeedRestore(
  queryClient: QueryClient,
  queryHash: string,
  restore: Omit<PostFeedRestore, 'status'>,
) {
  // So that the query's removal settles it.
  getEntries(queryClient)
  let records = restores.get(queryClient)
  if (!records) {
    records = new Map()
    restores.set(queryClient, records)
  }
  records.set(queryHash, {...restore, status: 'pending'})
}

/**
 * The restore of the post-feed query with this key, if it was restored this
 * account session.
 */
export function getPostFeedRestore(
  queryClient: QueryClient,
  queryKey: QueryKey,
): PostFeedRestore | undefined {
  return restores.get(queryClient)?.get(hashKey(queryKey))
}

/**
 * Whether the post-feed query with this key was restored and its follow-up has
 * not finished, whether it has started or not. Checks and polls that would
 * measure the restored top hold back until it has.
 */
export function isPostFeedRestorePending(
  queryClient: QueryClient,
  queryKey: QueryKey,
) {
  const status = getPostFeedRestore(queryClient, queryKey)?.status
  return status === 'pending' || status === 'prepending'
}

/**
 * Claims the follow-up of the restore of the post-feed query with this key,
 * if it is still to be made. True for exactly one caller per account session.
 */
export function beginPostFeedRestorePrepend(
  queryClient: QueryClient,
  queryKey: QueryKey,
) {
  const restore = getPostFeedRestore(queryClient, queryKey)
  if (restore?.status !== 'pending') {
    return false
  }
  restore.status = 'prepending'
  return true
}

/**
 * Marks the restore of the query with this hash as followed up, if it had one.
 */
export function settlePostFeedRestore(
  queryClient: QueryClient,
  queryHash: string,
) {
  const restore = restores.get(queryClient)?.get(queryHash)
  if (restore) {
    restore.status = 'settled'
  }
}
