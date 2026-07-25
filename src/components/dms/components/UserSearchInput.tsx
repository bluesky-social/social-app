import {TextInput, View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme, web} from '#/alf'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {MagnifyingGlass_Stroke2_Corner0_Rounded as SearchIcon} from '#/components/icons/MagnifyingGlass'

export function UserSearchInput({
  value,
  onChangeText,
  onEscape,
  inputRef,
}: {
  value: string
  onChangeText: (text: string) => void
  onEscape: () => void
  inputRef: React.RefObject<TextInput | null>
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const {
    state: hovered,
    onIn: onMouseEnter,
    onOut: onMouseLeave,
  } = useInteractionState()
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()
  const interacted = hovered || focused

  return (
    <View
      {...web({
        onMouseEnter,
        onMouseLeave,
      })}
      style={[a.flex_row, a.align_center, a.gap_sm]}>
      <SearchIcon
        size="md"
        fill={interacted ? t.palette.primary_500 : t.palette.contrast_300}
      />
      <TextInput
        // @ts-ignore bottom sheet input types issue - esb
        ref={inputRef}
        placeholder={l`Search for people`}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        style={[a.flex_1, a.py_md, a.text_md, t.atoms.text]}
        placeholderTextColor={t.palette.contrast_500}
        keyboardAppearance={t.name === 'light' ? 'light' : 'dark'}
        returnKeyType="search"
        clearButtonMode="while-editing"
        maxLength={50}
        onKeyPress={({nativeEvent}) => {
          if (nativeEvent.key === 'Escape') {
            onEscape()
          }
        }}
        autoCorrect={false}
        autoComplete="off"
        autoCapitalize="none"
        autoFocus
        accessibilityLabel={l`Search profiles`}
        accessibilityHint={l`Searches for profiles`}
      />
    </View>
  )
}
