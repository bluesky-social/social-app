import {useCallback, useEffect} from 'react'
import {type AtIdentifierString} from '@atproto/syntax'
import {useQuery, useQueryClient} from '@tanstack/react-query'

import {GCTIME, STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {useAppviewClient, useSession} from '#/state/session'
import {
  type SearchFilters,
  serializeHistoryEntry,
} from '#/screens/Search/searchParams'
import {app} from '#/lexicons'
import {account, useStorage} from '#/storage'
import type * as bsky from '#/types/bsky'

const MAX_TERMS = 6
const MAX_PROFILES = 10

const recentSearchProfilesQueryKey = (did: string) =>
  createQueryKey('useRecentSearchProfilesQuery', {did}, {persistedVersion: 1})

function useRecentSearchProfilesQuery(did: string, accountHistory: string[]) {
  const client = useAppviewClient()
  const queryClient = useQueryClient()
  const {data, refetch} = useQuery({
    queryKey: recentSearchProfilesQueryKey(did),
    enabled: accountHistory.length > 0,
    staleTime: STALE.MINUTES.FIVE,
    gcTime: GCTIME.INFINITY,
    refetchOnWindowFocus: true,
    refetchInterval: STALE.MINUTES.FIVE,
    async queryFn(): Promise<bsky.profile.AnyProfileView[]> {
      try {
        const data = await client.call(app.bsky.actor.getProfiles, {
          actors: accountHistory as AtIdentifierString[],
        })
        return data.profiles
      } catch (error) {
        /* Keep offline snapshots eligible for persistence, which only saves
         * successful queries. Retry on the next refresh opportunity. */
        const cached = queryClient.getQueryData<bsky.profile.AnyProfileView[]>(
          recentSearchProfilesQueryKey(did),
        )
        if (cached) return cached
        throw error
      }
    },
  })

  /* The cache key stays bounded to one snapshot per account. Refresh when
   * its membership changes, including after restoring older DID-only history. */
  useEffect(() => {
    if (accountHistory.length) void refetch({cancelRefetch: false})
  }, [accountHistory, refetch])

  return data
}

/**
 * Per-account recent search history (device storage). Terms are stored as
 * serialized history entries (plain string, or JSON when filters are
 * attached); profile snapshots are persisted in an account-scoped query and
 * revalidated while in use. Both lists are ordered most-recent-first.
 */
export function useSearchHistory() {
  const {currentAccount} = useSession()
  const queryClient = useQueryClient()
  const did = currentAccount?.did ?? 'pwi'
  const [termHistory = [], setTermHistory] = useStorage(account, [
    did,
    'searchTermHistory',
  ] as const)
  const [accountHistory = [], setAccountHistory] = useStorage(account, [
    did,
    'searchAccountHistory',
  ])
  const accountHistoryProfiles = useRecentSearchProfilesQuery(
    did,
    accountHistory,
  )

  /*
   * getProfiles response order is not guaranteed, so map over accountHistory
   * to preserve most-recent-first order (and drop entries not yet hydrated).
   */
  const profiles = accountHistory
    .map(did => accountHistoryProfiles?.find(p => p.did === did))
    .filter(p => p !== undefined)

  const updateSearchHistory = useCallback(
    (q: string, searchFilters: SearchFilters = {}) => {
      if (!q) return
      /*
       * Store the query plus any advanced-search filters. Term-only searches
       * serialize to a plain string (back-compatible with existing history);
       * filtered searches serialize to JSON. Dedupe on the serialized form.
       */
      const item = serializeHistoryEntry(q, searchFilters)
      const newSearchHistory = [
        item,
        ...termHistory.filter(search => search !== item),
      ].slice(0, MAX_TERMS)
      setTermHistory(newSearchHistory)
    },
    [termHistory, setTermHistory],
  )

  const updateProfileHistory = useCallback(
    (item: bsky.profile.AnyProfileView) => {
      const newAccountHistory = [
        item.did,
        ...accountHistory.filter(p => p !== item.did),
      ].slice(0, MAX_PROFILES)
      void queryClient.cancelQueries({
        queryKey: recentSearchProfilesQueryKey(did),
      })
      queryClient.setQueryData<bsky.profile.AnyProfileView[]>(
        recentSearchProfilesQueryKey(did),
        previous =>
          [item, ...(previous ?? []).filter(p => p.did !== item.did)].filter(
            p => newAccountHistory.includes(p.did),
          ),
      )
      setAccountHistory(newAccountHistory)
    },
    [accountHistory, setAccountHistory, queryClient, did],
  )

  const deleteSearchHistoryItem = useCallback(
    (item: string) => {
      setTermHistory(termHistory.filter(search => search !== item))
    },
    [termHistory, setTermHistory],
  )

  const deleteProfileHistoryItem = useCallback(
    (item: bsky.profile.AnyProfileView) => {
      void queryClient.cancelQueries({
        queryKey: recentSearchProfilesQueryKey(did),
      })
      queryClient.setQueryData<bsky.profile.AnyProfileView[]>(
        recentSearchProfilesQueryKey(did),
        previous => previous?.filter(p => p.did !== item.did),
      )
      setAccountHistory(accountHistory.filter(p => p !== item.did))
    },
    [accountHistory, setAccountHistory, queryClient, did],
  )

  return {
    termHistory,
    profiles,
    updateSearchHistory,
    updateProfileHistory,
    deleteSearchHistoryItem,
    deleteProfileHistoryItem,
  }
}
