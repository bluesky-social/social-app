import {useSession} from '#/state/session'
import {
  type SearchFilters,
  serializeHistoryEntry,
} from '#/screens/Search/searchParams'
import {useAnalytics} from '#/analytics'
import {account, useStorage} from '#/storage'
import type * as bsky from '#/types/bsky'

const MAX_TERMS = 6
const MAX_PROFILES = 10

/**
 * Recent searches for the current account (or the logged-out session), stored
 * on this device. Shared by the Search screen and the desktop sidebar search so
 * both read and write the same lists, most recent first.
 */
export function useSearchHistory() {
  const ax = useAnalytics()
  const {currentAccount} = useSession()
  const scope = currentAccount?.did ?? 'pwi'

  const [termHistory = [], setTermHistory] = useStorage(account, [
    scope,
    'searchTermHistory',
  ] as const)
  const [accountHistory = [], setAccountHistory] = useStorage(account, [
    scope,
    'searchAccountHistory',
  ] as const)

  const updateSearchHistory = (q: string, filters: SearchFilters = {}) => {
    if (!q) return
    /*
     * Store the query plus any advanced-search filters. Term-only searches
     * serialize to a plain string (back-compatible with existing history);
     * filtered searches serialize to JSON. Dedupe on the serialized form.
     */
    const item = serializeHistoryEntry(q, filters)
    setTermHistory(
      [item, ...termHistory.filter(search => search !== item)].slice(
        0,
        MAX_TERMS,
      ),
    )
  }

  const updateProfileHistory = (profile: bsky.profile.AnyProfileView) => {
    setAccountHistory(
      [profile.did, ...accountHistory.filter(did => did !== profile.did)].slice(
        0,
        MAX_PROFILES,
      ),
    )
  }

  const deleteSearchHistoryItem = (item: string) => {
    setTermHistory(termHistory.filter(search => search !== item))
  }

  const deleteProfileHistoryItem = (profile: bsky.profile.AnyProfileView) => {
    setAccountHistory(accountHistory.filter(did => did !== profile.did))
  }

  const clearAllHistory = () => {
    ax.metric('search:recent:clearAll', {
      termCount: termHistory.length,
      profileCount: accountHistory.length,
    })
    setTermHistory([])
    setAccountHistory([])
  }

  return {
    termHistory,
    accountHistory,
    updateSearchHistory,
    updateProfileHistory,
    deleteSearchHistoryItem,
    deleteProfileHistoryItem,
    clearAllHistory,
  }
}
