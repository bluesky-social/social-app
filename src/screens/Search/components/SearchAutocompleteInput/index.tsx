import {useRef, useState} from 'react'
import {type TextInput, View} from 'react-native'
import {useSift} from '@bsky.app/sift'

import {mergeRefs} from '#/lib/merge-refs'
import {atoms as a} from '#/alf'
import {
  Autocomplete,
  type AutocompleteItem,
  useAutocomplete,
} from '#/components/Autocomplete'
import {SearchInput} from '#/components/forms/SearchInput'
import {type SearchAutocompleteInputProps} from './shared'

/**
 * Web: typed results float in a Sift dropdown anchored to the search input
 * (matching the desktop nav-bar search). Search history continues to render
 * full-page underneath the input in Shell.tsx, so it is not shown here. See
 * index.native.tsx for the native (inline list) variant.
 */
export function SearchAutocompleteInput({
  fixedParams,
  onSelectProfile,
  onSelectSearch,
  value = '',
  onFocus,
  onBlur,
  ref,
  ...rest
}: SearchAutocompleteInputProps) {
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<TextInput>(null)

  const sift = useSift({
    offset: a.p_sm.padding,
    placement: 'bottom',
  })

  const {items} = useAutocomplete({
    type: 'profile',
    // The dropdown only shows while focused, so don't fetch until then. This
    // avoids a typeahead request on mount when arriving with text already
    // present (e.g. /search?q=foo).
    query: focused ? value : '',
    showSearchFallback: true,
  })

  const showDropdown =
    focused && !fixedParams && value.length > 0 && items.length > 0

  function onSelect(item: AutocompleteItem) {
    if (item.type === 'profile') {
      const position = items.filter(i => i.type === 'profile').indexOf(item)
      onSelectProfile?.(item.profile, position)
    } else if (item.type === 'search') {
      onSelectSearch?.(item.value)
    }
    inputRef.current?.blur()
  }

  /*
   * setAnchor goes on the full-width wrapper View so the dropdown matches the
   * input's container width; the input ref (targetProps.ref) lands on the inner
   * TextInput for Sift's positioning math, and the remaining combobox a11y
   * props are spread onto the input.
   */
  const {setAnchor} = sift.refs
  const {ref: inputAnchorRef, ...comboboxProps} = sift.targetProps

  return (
    <View
      collapsable={false}
      ref={setAnchor}
      /*
       * Focusing the input reveals the Cancel button alongside it (see
       * Shell.tsx), which shrinks the anchor after Sift's initial measurement
       * and leaves the dropdown too wide until the next re-measure. Recompute on
       * layout (react-native-web backs onLayout with a ResizeObserver) so the
       * width tracks the anchor through that reflow and window resizes.
       */
      onLayout={() => void sift.updatePosition()}>
      <SearchInput
        {...rest}
        {...comboboxProps}
        ref={mergeRefs([ref, inputAnchorRef, inputRef])}
        value={value}
        onFocus={e => {
          setFocused(true)
          onFocus?.(e)
        }}
        onBlur={e => {
          setFocused(false)
          onBlur?.(e)
        }}
      />
      {showDropdown && (
        <Autocomplete
          sift={sift}
          data={items}
          onSelect={onSelect}
          onDismiss={() => setFocused(false)}
          fullWidth
        />
      )}
    </View>
  )
}
