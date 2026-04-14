import {Pressable, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {MagnifyingGlass_Stroke2_Corner0_Rounded as SearchIcon} from '#/components/icons/MagnifyingGlass'
import {Text} from '#/components/Typography'

const LISTBOX_ID = 'gif-autocomplete-listbox'

export function suggestionItemId(index: number) {
  return `gif-autocomplete-option-${index}`
}

export {LISTBOX_ID as GIF_AUTOCOMPLETE_LISTBOX_ID}

export function GifAutocompleteSuggestions({
  suggestions,
  activeIndex,
  onSelect,
}: {
  suggestions: string[]
  activeIndex: number
  onSelect: (suggestion: string) => void
}) {
  const {_} = useLingui()
  const t = useTheme()

  if (suggestions.length === 0) return null

  return (
    <View
      role="list"
      id={LISTBOX_ID}
      aria-label={_(msg`Search suggestions`)}
      style={[a.rounded_sm, a.overflow_hidden, a.mt_xs, a.mb_sm]}>
      {suggestions.map((suggestion, index) => {
        const isActive = index === activeIndex
        return (
          <Pressable
            key={suggestion}
            role="option"
            id={suggestionItemId(index)}
            aria-selected={isActive}
            accessibilityLabel={suggestion}
            accessibilityHint={_(msg`Search for ${suggestion}`)}
            onPress={() => onSelect(suggestion)}
            style={state => [
              a.flex_row,
              a.align_center,
              a.gap_sm,
              a.px_md,
              a.py_sm,
              (isActive || ('hovered' in state && state.hovered)) &&
                t.atoms.bg_contrast_25,
            ]}>
            <SearchIcon size="sm" fill={t.atoms.text_contrast_medium.color} />
            <Text style={[a.text_md, a.flex_1]} numberOfLines={1}>
              {suggestion}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
