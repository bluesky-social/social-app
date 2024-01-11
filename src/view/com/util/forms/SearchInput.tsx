import React from 'react'
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {HITSLOP_10} from 'lib/constants'
import {MagnifyingGlassIcon} from 'lib/icons'
import {useTheme} from 'lib/ThemeContext'
import {usePalette} from 'lib/hooks/usePalette'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'

interface Props {
  query: string
  setIsInputFocused?: (v: boolean) => void
  onChangeQuery: (v: string) => void
  onPressCancelSearch: () => void
  onSubmitQuery: () => void
  style?: StyleProp<ViewStyle>
}
export function SearchInput({
  query,
  setIsInputFocused,
  onChangeQuery,
  onPressCancelSearch,
  onSubmitQuery,
  style,
}: Props) {
  const theme = useTheme()
  const pal = usePalette('default')
  const {_} = useLingui()
  const textInput = React.useRef<TextInput>(null)

  const onPressCancelSearchInner = React.useCallback(() => {
    onPressCancelSearch()
    textInput.current?.blur()
  }, [onPressCancelSearch, textInput])

  return (
    <View style={[pal.viewLight, styles.container, style]}>
      <MagnifyingGlassIcon style={[pal.icon, styles.icon]} size={21} />
      <TextInput
        testID="searchTextInput"
        ref={textInput}
        placeholder={_(msg`Search`)}
        placeholderTextColor={pal.colors.textLight}
        selectTextOnFocus
        returnKeyType="search"
        value={query}
        style={[pal.text, styles.input]}
        keyboardAppearance={theme.colorScheme}
        onFocus={() => setIsInputFocused?.(true)}
        onBlur={() => setIsInputFocused?.(false)}
        onChangeText={onChangeQuery}
        onSubmitEditing={onSubmitQuery}
        accessibilityRole="search"
        accessibilityLabel={_(msg`Search`)}
        accessibilityHint=""
        autoCorrect={false}
        autoCapitalize="none"
      />
      {query ? (
        <TouchableOpacity
          onPress={onPressCancelSearchInner}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Clear search query`)}
          accessibilityHint=""
          hitSlop={HITSLOP_10}>
          <FontAwesomeIcon
            icon="xmark"
            size={16}
            style={pal.textLight as FontAwesomeIconStyle}
          />
        </TouchableOpacity>
      ) : undefined}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  icon: {
    marginRight: 6,
    alignSelf: 'center',
  },
  input: {
    flex: 1,
    fontSize: 17,
    minWidth: 0, // overflow mitigation for firefox
  },
  cancelBtn: {
    paddingLeft: 10,
  },
})
