import React from 'react'
import {StyleSheet, TextInput, TouchableOpacity, View} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {Text} from 'view/com/util/text/Text'
import {MagnifyingGlassIcon} from 'lib/icons'
import {useTheme} from 'lib/ThemeContext'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {useAnalytics} from 'lib/analytics/analytics'
import {HITSLOP_10} from 'lib/constants'

interface Props {
  isInputFocused: boolean
  query: string
  setIsInputFocused: (v: boolean) => void
  onChangeQuery: (v: string) => void
  onPressClearQuery: () => void
  onPressCancelSearch: () => void
  onSubmitQuery: () => void
  showMenu?: boolean
}
export function HeaderWithInput({
  isInputFocused,
  query,
  setIsInputFocused,
  onChangeQuery,
  onPressClearQuery,
  onPressCancelSearch,
  onSubmitQuery,
  showMenu = true,
}: Props) {
  const store = useStores()
  const theme = useTheme()
  const pal = usePalette('default')
  const {track} = useAnalytics()
  const textInput = React.useRef<TextInput>(null)

  const onPressMenu = React.useCallback(() => {
    track('ViewHeader:MenuButtonClicked')
    store.shell.openDrawer()
  }, [track, store])

  const onPressCancelSearchInner = React.useCallback(() => {
    onPressCancelSearch()
    textInput.current?.blur()
  }, [onPressCancelSearch, textInput])

  return (
    <View style={[pal.view, pal.border, styles.header]}>
      {showMenu ? (
        <TouchableOpacity
          testID="viewHeaderBackOrMenuBtn"
          onPress={onPressMenu}
          hitSlop={HITSLOP_10}
          style={styles.headerMenuBtn}
          accessibilityRole="button"
          accessibilityLabel="Menu"
          accessibilityHint="Access navigation links and settings">
          <FontAwesomeIcon icon="bars" size={18} color={pal.colors.textLight} />
        </TouchableOpacity>
      ) : null}
      <View
        style={[
          {backgroundColor: pal.colors.backgroundLight},
          styles.headerSearchContainer,
        ]}>
        <MagnifyingGlassIcon
          style={[pal.icon, styles.headerSearchIcon]}
          size={21}
        />
        <TextInput
          testID="searchTextInput"
          ref={textInput}
          placeholder="Search"
          placeholderTextColor={pal.colors.textLight}
          selectTextOnFocus
          returnKeyType="search"
          value={query}
          style={[pal.text, styles.headerSearchInput]}
          keyboardAppearance={theme.colorScheme}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          onChangeText={onChangeQuery}
          onSubmitEditing={onSubmitQuery}
          autoFocus={true}
          accessibilityRole="search"
          accessibilityLabel="Search"
          accessibilityHint=""
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query ? (
          <TouchableOpacity
            onPress={onPressClearQuery}
            accessibilityRole="button"
            accessibilityLabel="Clear search query"
            accessibilityHint="">
            <FontAwesomeIcon
              icon="xmark"
              size={16}
              style={pal.textLight as FontAwesomeIconStyle}
            />
          </TouchableOpacity>
        ) : undefined}
      </View>
      {query || isInputFocused ? (
        <View style={styles.headerCancelBtn}>
          <TouchableOpacity
            onPress={onPressCancelSearchInner}
            accessibilityRole="button">
            <Text style={pal.text}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : undefined}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  headerMenuBtn: {
    width: 30,
    height: 30,
    borderRadius: 30,
    marginRight: 6,
    paddingBottom: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSearchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerSearchIcon: {
    marginRight: 6,
    alignSelf: 'center',
  },
  headerSearchInput: {
    flex: 1,
    fontSize: 17,
  },
  headerCancelBtn: {
    paddingLeft: 10,
  },

  searchPrompt: {
    textAlign: 'center',
    paddingTop: 10,
  },

  suggestions: {
    marginBottom: 8,
  },
})
