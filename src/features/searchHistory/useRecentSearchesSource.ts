import {parseHistoryEntry} from '#/screens/Search/searchParams'
import {
  type AutocompleteItem,
  type LocalSource,
} from '#/components/Autocomplete/types'
import {useSearchHistory} from './index'

/**
 * Recent searches as an autocomplete LocalSource: recently searched profiles
 * first, then recent search terms. Most recent first (storage order).
 */
export function useRecentSearchesSource({
  profilesOnly = false,
}: {profilesOnly?: boolean} = {}): LocalSource {
  const {termHistory, profiles} = useSearchHistory()

  const items: AutocompleteItem[] = profiles.map(profile => ({
    key: profile.did,
    type: 'profile' as const,
    value: '@' + profile.handle,
    profile,
  }))

  if (!profilesOnly) {
    for (const entry of termHistory) {
      const {q, filters} = parseHistoryEntry(entry)
      if (!q) continue
      items.push({
        key: `recent-${entry}`,
        type: 'search' as const,
        value: q,
        filters,
      })
    }
  }

  return {key: 'recents', items}
}
