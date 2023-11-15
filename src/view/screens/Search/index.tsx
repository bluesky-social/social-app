import React from 'react'
import {StyleSheet, TextInput, Pressable, View} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {usePalette} from 'lib/hooks/usePalette'
import {useTheme} from 'lib/ThemeContext'
import {HITSLOP_10} from '#/lib/constants'
import {
  NativeStackScreenProps,
  SearchTabNavigatorParams,
} from '#/lib/routes/types'
import {useSetDrawerOpen} from '#/state/shell'
import {useAnalytics} from '#/lib/analytics/analytics'

import {Text} from 'view/com/util/text/Text'
import {MagnifyingGlassIcon} from '#/lib/icons'
import {SearchScreenInner} from '#/view/screens/Search/Search'

export function SearchScreen(
  props: NativeStackScreenProps<SearchTabNavigatorParams, 'Search'>,
) {
  const theme = useTheme()
  const textInput = React.useRef<TextInput>(null)
  const [query, setQuery] = React.useState(props.route?.params?.q || '')
  const [inputIsFocused, setInputIsFocused] = React.useState(false)

  const {_} = useLingui()
  const pal = usePalette('default')
  const {track} = useAnalytics()
  const setDrawerOpen = useSetDrawerOpen()

  const onPressMenu = React.useCallback(() => {
    track('ViewHeader:MenuButtonClicked')
    setDrawerOpen(true)
  }, [track, setDrawerOpen])
  const onPressCancelSearchInner = React.useCallback(() => {
    textInput.current?.blur()
    setQuery('')
  }, [textInput])
  const onPressClearQuery = React.useCallback(() => {
    setQuery('')
  }, [setQuery])

  return (
    <>
      <View style={[styles.header]}>
        <Pressable
          testID="viewHeaderBackOrMenuBtn"
          onPress={onPressMenu}
          hitSlop={HITSLOP_10}
          style={styles.headerMenuBtn}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Menu`)}
          accessibilityHint="Access navigation links and settings">
          <FontAwesomeIcon icon="bars" size={18} color={pal.colors.textLight} />
        </Pressable>

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
            onFocus={() => setInputIsFocused(true)}
            onBlur={() => setInputIsFocused(false)}
            onChangeText={text => setQuery(text)}
            // onSubmitEditing={onSubmitQuery}
            autoFocus={false}
            accessibilityRole="search"
            accessibilityLabel={_(msg`Search`)}
            accessibilityHint=""
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query ? (
            <Pressable
              testID="searchTextInputClearBtn"
              onPress={onPressClearQuery}
              accessibilityRole="button"
              accessibilityLabel={_(msg`Clear search query`)}
              accessibilityHint="">
              <FontAwesomeIcon
                icon="xmark"
                size={16}
                style={pal.textLight as FontAwesomeIconStyle}
              />
            </Pressable>
          ) : undefined}
        </View>

        {query || inputIsFocused ? (
          <View style={styles.headerCancelBtn}>
            <Pressable
              onPress={onPressCancelSearchInner}
              accessibilityRole="button">
              <Text style={[pal.text]}>
                <Trans>Cancel</Trans>
              </Text>
            </Pressable>
          </View>
        ) : undefined}
      </View>

      <SearchScreenInner query={query} />
    </>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  headerDesktop: {
    borderWidth: 1,
    borderTopWidth: 0,
    paddingVertical: 10,
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
