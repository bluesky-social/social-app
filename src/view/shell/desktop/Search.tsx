import React from 'react'
import {TextInput, View, StyleSheet, TouchableOpacity} from 'react-native'
import {useNavigation, StackActions} from '@react-navigation/native'
import {AppBskyActorDefs} from '@atproto/api'

import {observer} from 'mobx-react-lite'
import {usePalette} from 'lib/hooks/usePalette'
import {MagnifyingGlassIcon2} from 'lib/icons'
import {NavigationProp} from 'lib/routes/types'
import {ProfileCard} from 'view/com/profile/ProfileCard'
import {Text} from 'view/com/util/text/Text'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useActorSearch} from '#/state/queries/actor-autocomplete'

export const DesktopSearch = observer(function DesktopSearch() {
  const {_} = useLingui()
  const pal = usePalette('default')
  const navigation = useNavigation<NavigationProp>()
  const searchDebounceTimeout = React.useRef<NodeJS.Timeout | undefined>(
    undefined,
  )
  const [isInputFocused, setIsInputFocused] = React.useState<boolean>(false)
  const [query, setQuery] = React.useState<string>('')
  const [searchResults, setSearchResults] = React.useState<
    AppBskyActorDefs.ProfileViewBasic[]
  >([])

  const search = useActorSearch()

  const onChangeText = React.useCallback(
    async (text: string) => {
      setQuery(text)

      if (text.length > 0 && isInputFocused) {
        if (searchDebounceTimeout.current)
          clearTimeout(searchDebounceTimeout.current)

        searchDebounceTimeout.current = setTimeout(async () => {
          const results = await search({query: text})

          if (results) {
            setSearchResults(results)
          }
        }, 300)
      } else {
        if (searchDebounceTimeout.current)
          clearTimeout(searchDebounceTimeout.current)
        setSearchResults([])
      }
    },
    [setQuery, isInputFocused, search, setSearchResults],
  )

  const onPressCancelSearch = React.useCallback(() => {
    onChangeText('')
  }, [onChangeText])

  const onSubmit = React.useCallback(() => {
    navigation.dispatch(StackActions.push('Search', {q: query}))
  }, [query, navigation])

  return (
    <View style={[styles.container, pal.view]}>
      <View
        style={[{backgroundColor: pal.colors.backgroundLight}, styles.search]}>
        <View style={[styles.inputContainer]}>
          <MagnifyingGlassIcon2
            size={18}
            style={[pal.textLight, styles.iconWrapper]}
          />
          <TextInput
            testID="searchTextInput"
            placeholder="Search"
            placeholderTextColor={pal.colors.textLight}
            selectTextOnFocus
            returnKeyType="search"
            value={query}
            style={[pal.textLight, styles.input]}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmit}
            accessibilityRole="search"
            accessibilityLabel={_(msg`Search`)}
            accessibilityHint=""
          />
          {query ? (
            <View style={styles.cancelBtn}>
              <TouchableOpacity
                onPress={onPressCancelSearch}
                accessibilityRole="button"
                accessibilityLabel={_(msg`Cancel search`)}
                accessibilityHint="Exits inputting search query"
                onAccessibilityEscape={onPressCancelSearch}>
                <Text type="lg" style={[pal.link]}>
                  <Trans>Cancel</Trans>
                </Text>
              </TouchableOpacity>
            </View>
          ) : undefined}
        </View>
      </View>

      {query !== '' && (
        <View style={[pal.view, pal.borderDark, styles.resultsContainer]}>
          {searchResults.length ? (
            <>
              {searchResults.map((item, i) => (
                <ProfileCard key={item.did} profile={item} noBorder={i === 0} />
              ))}
            </>
          ) : (
            <View>
              <Text style={[pal.textLight, styles.noResults]}>
                <Trans>No results found for {query}</Trans>
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: 300,
    paddingBottom: 18,
  },
  search: {
    paddingHorizontal: 16,
    paddingVertical: 2,
    width: 300,
    borderRadius: 20,
  },
  inputContainer: {
    flexDirection: 'row',
  },
  iconWrapper: {
    position: 'relative',
    top: 2,
    paddingVertical: 7,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 18,
    width: '100%',
    paddingTop: 7,
    paddingBottom: 7,
  },
  cancelBtn: {
    paddingRight: 4,
    paddingLeft: 10,
    paddingVertical: 7,
  },
  resultsContainer: {
    // @ts-ignore supported by web
    // position: 'fixed',
    marginTop: 10,

    flexDirection: 'column',
    width: 300,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 4,
  },
  noResults: {
    textAlign: 'center',
    paddingVertical: 10,
  },
})
