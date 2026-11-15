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
   * Web only. Called when the "Search for X" row in the dropdown is selected.
   */
  onSelectSearch?: (value: string) => void
}
