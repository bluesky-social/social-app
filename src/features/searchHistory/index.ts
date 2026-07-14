import {useCallback} from 'react'

import {useProfilesQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {
  type SearchFilters,
  serializeHistoryEntry,
} from '#/screens/Search/searchParams'
import {account, useStorage} from '#/storage'
import type * as bsky from '#/types/bsky'

const MAX_TERMS = 6
const MAX_PROFILES = 10

/**
 * Per-account recent search history (device storage). Terms are stored as
 * serialized history entries (plain string, or JSON when filters are
 * attached); profiles are stored as DIDs and hydrated via useProfilesQuery,
 * which keeps avatars/names fresh (stale-while-revalidate).
 */
export function useSearchHistory() {
  const {currentAccount} = useSession()
  const [termHistory = [], setTermHistory] = useStorage(account, [
    currentAccount?.did ?? 'pwi',
    'searchTermHistory',
  ] as const)
  const [accountHistory = [], setAccountHistory] = useStorage(account, [
    currentAccount?.did ?? 'pwi',
    'searchAccountHistory',
  ])

  const {data: accountHistoryProfiles} = useProfilesQuery({
    handles: accountHistory,
    maintainData: true,
  })

  const profiles =
    accountHistoryProfiles?.profiles.filter(p =>
      accountHistory.includes(p.did),
    ) ?? []

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
      setAccountHistory(newAccountHistory)
    },
    [accountHistory, setAccountHistory],
  )

  const deleteSearchHistoryItem = useCallback(
    (item: string) => {
      setTermHistory(termHistory.filter(search => search !== item))
    },
    [termHistory, setTermHistory],
  )

  const deleteProfileHistoryItem = useCallback(
    (item: bsky.profile.AnyProfileView) => {
      setAccountHistory(accountHistory.filter(p => p !== item.did))
    },
    [accountHistory, setAccountHistory],
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
