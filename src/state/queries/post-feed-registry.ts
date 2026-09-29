import {hashKey, type QueryClient, type QueryKey} from '@tanstack/react-query'

import {type FeedAPI} from '#/lib/api/feed/types'

/** Live feed state, kept outside serializable query data. */
export type PostFeedQueryEntry = {
  /**
   * Keyed by pages and continuation params so overlapping refresh and
   * pagination chains keep their own stateful APIs.
   */
  feedApis: WeakMap<object, FeedAPI>
}

const registries = new WeakMap<QueryClient, Map<string, PostFeedQueryEntry>>()

function getEntries(queryClient: QueryClient) {
  let entries = registries.get(queryClient)
  if (!entries) {
    const created = new Map<string, PostFeedQueryEntry>()
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

export function getPostFeedQueryEntry(
  queryClient: QueryClient,
  queryKey: QueryKey,
): PostFeedQueryEntry {
  const queryHash = hashKey(queryKey)
  const entries = getEntries(queryClient)
  let entry = entries.get(queryHash)
  if (!entry) {
    entry = {feedApis: new WeakMap()}
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
