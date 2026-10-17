import {type SearchFilters} from '#/screens/Search/searchParams'
import {type SearchInput} from '#/components/forms/SearchInput'
import type * as bsky from '#/types/bsky'

type SearchInputProps = React.ComponentProps<typeof SearchInput>

export type SearchAutocompleteInputProps = SearchInputProps & {
  /**
   * When the search has fixed params (e.g. ProfileSearch), the web dropdown is
   * suppressed.
   */
  fixedParams?: boolean
  /**
   * Web only. Called when a profile result in the dropdown is selected.
   */
  onSelectProfile?: (
    profile: bsky.profile.AnyProfileView,
    position: number,
  ) => void
  /**
   * Web only. Called when a search row is selected, with saved filters for
   * recent searches and undefined for the typed fallback.
   */
  onSelectSearch?: (value: string, filters?: SearchFilters) => void
}
