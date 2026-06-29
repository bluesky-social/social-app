import {SearchInput} from '#/components/forms/SearchInput'
import {type SearchAutocompleteInputProps} from './shared'

/**
 * Native: renders the search input as-is. Typed results are shown inline in the
 * full-page list (see Shell.tsx), so there is no anchored dropdown here. See
 * index.web.tsx for the web (floating Sift dropdown) variant.
 */
export function SearchAutocompleteInput({
  // web-only props are ignored on native
  fixedParams: _fixedParams,
  onSelectProfile: _onSelectProfile,
  onSelectSearch: _onSelectSearch,
  ...rest
}: SearchAutocompleteInputProps) {
  return <SearchInput {...rest} />
}
