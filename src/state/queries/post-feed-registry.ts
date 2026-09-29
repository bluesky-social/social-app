import {
  hashKey,
  type InfiniteData,
  notifyManager,
  type QueryClient,
  type QueryFilters,
  type QueryKey,
} from '@tanstack/react-query'

import {type FeedAPI} from '#/lib/api/feed/types'
import {type PostFeedCheckState} from './post-feed-checks'

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
  /**
   * When the query was last checked for new content, the check in flight, the
   * real return it still owes a check or an offer, and what its latest positive
   * focus or interval check found. Shared by every view of the query - see
   * `post-feed-checks.ts`, which creates it on first use.
   */
  checks?: PostFeedCheckState
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
