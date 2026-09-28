import {hashKey, type QueryClient, type QueryKey} from '@tanstack/react-query'

import {type FeedAPI} from '#/lib/api/feed/types'

/**
 * State that belongs to one exact post-feed query but cannot live in its
 * cached data, which has to stay serializable.
 *
 * Every account has its own `QueryClient` (see `QueryProvider`) and gets its
 * own registry of these, created on first use and dropped along with the
 * client, so an account switch or logout never hands one account's state to
 * another. Within a client there is one entry per exact query, keyed by query
 * hash, and it is disposed when that query is removed from the cache.
 */
export type PostFeedQueryEntry = {
  /**
   * The `FeedAPI` behind each of the query's pages, and behind each page param
   * that continues from one, keyed by the page or page param object itself.
   *
   * This is what `page.api` and `pageParam.api` used to carry: a fetch from
   * the top starts a fresh API, and each later page continues with the API
   * that fetched the page before it. Following the objects rather than keeping
   * one API per query matters when two chains of pages coexist - a refetch in
   * flight or failed while the cached pages still paginate, or a cancelled
   * refetch still running in the background - because `HomeFeedAPI` and
   * `MergeFeedAPI` carry state that is only valid for their own chain.
   *
   * This relies on the cache holding the exact page objects the query function
   * returned, hence `structuralSharing: false` on the query. A page with no API
   * here continues with a fresh one.
   */
  feedApis: WeakMap<object, FeedAPI>
}

const registries = new WeakMap<QueryClient, Map<string, PostFeedQueryEntry>>()

function getEntries(queryClient: QueryClient) {
  let entries = registries.get(queryClient)
  if (!entries) {
    const created = new Map<string, PostFeedQueryEntry>()
    // Lives as long as the client's cache, so it is never unsubscribed.
    queryClient.getQueryCache().subscribe(event => {
      if (event.type === 'removed') {
        created.delete(event.query.queryHash)
      }
    })
    registries.set(queryClient, created)
    entries = created
  }
  return entries
}

/**
 * The entry for the post-feed query with this key, created on first use while
 * that query is cached.
 */
export function getPostFeedQueryEntry(
  queryClient: QueryClient,
  queryKey: QueryKey,
): PostFeedQueryEntry {
  const queryHash = hashKey(queryKey)
  const entries = getEntries(queryClient)
  let entry = entries.get(queryHash)
  if (!entry) {
    entry = {feedApis: new WeakMap()}
    /*
     * A fetch can outlive its query, which can be removed from the cache while
     * the fetch is in flight. Such a fetch gets an entry that is never stored,
     * so the registry only ever holds entries for cached queries, and the rest
     * of it continues with fresh APIs. Its pages are never committed.
     */
    if (queryClient.getQueryCache().get(queryHash)) {
      entries.set(queryHash, entry)
    }
  }
  return entry
}

/**
 * The entry for the post-feed query with this key, if it has one.
 */
export function peekPostFeedQueryEntry(
  queryClient: QueryClient,
  queryKey: QueryKey,
): PostFeedQueryEntry | undefined {
  return registries.get(queryClient)?.get(hashKey(queryKey))
}
