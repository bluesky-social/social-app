import React from 'react'
import {TextInput, View, StyleSheet, TouchableOpacity, Text} from 'react-native'
import {UserAutocompleteViewModel} from 'state/models/user-autocomplete-view'
import {observer} from 'mobx-react-lite'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {MagnifyingGlassIcon} from 'lib/icons'
import {ProfileCard} from '../../com/profile/ProfileCard'

export const DesktopSearch = observer(function DesktopSearch() {
  const store = useStores()
  const pal = usePalette('default')
  const textInput = React.useRef<TextInput>(null)
  const [isInputFocused, setIsInputFocused] = React.useState<boolean>(false)
  const [query, setQuery] = React.useState<string>('')
  const autocompleteView = React.useMemo<UserAutocompleteViewModel>(
    () => new UserAutocompleteViewModel(store),
    [store],
  )

  const onChangeQuery = (text: string) => {
    setQuery(text)
    if (text.length > 0 && isInputFocused) {
      autocompleteView.setActive(true)
      autocompleteView.setPrefix(text)
    } else {
      autocompleteView.setActive(false)
    }
  }

  const onPressCancelSearch = () => {
    setQuery('')
    autocompleteView.setActive(false)
  }

  return (
    <View
      style={[
        styles.searchContainer,
        pal.borderDark,
        pal.view,
        styles.container,
        styles.search,
      ]}>
      <View style={[styles.container, styles.searchInputWrapper]}>
        <MagnifyingGlassIcon
          size={18}
          style={[pal.textLight, styles.searchIconWrapper]}
        />

        <TextInput
          testID="searchTextInput"
          ref={textInput}
          placeholder="Search"
          placeholderTextColor={pal.colors.textLight}
          selectTextOnFocus
          returnKeyType="search"
          value={query}
          style={[pal.textLight, styles.headerSearchInput]}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          onChangeText={onChangeQuery}
        />

        {query ? (
          <View style={styles.headerCancelBtn}>
            <TouchableOpacity onPress={onPressCancelSearch}>
              <Text>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : undefined}
      </View>

      <View
        style={[
          {backgroundColor: pal.colors.background},
          styles.searchResultsContainer,
          styles.container,
        ]}>
        {query && autocompleteView.searchRes.length ? (
          <>
            {autocompleteView.searchRes.map(item => (
              <ProfileCard
                key={item.did}
                handle={item.handle}
                displayName={item.displayName}
                avatar={item.avatar}
              />
            ))}
          </>
        ) : query && !autocompleteView.searchRes.length ? (
          <View>
            <Text style={[pal.textLight, styles.searchPrompt]}>
              No results found for {autocompleteView.prefix}
            </Text>
          </View>
        ) : isInputFocused ? (
          <View>
            <Text style={[pal.textLight, styles.searchPrompt]}>
              Search for users on the network
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  search: {
    maxWidth: 300,
    borderRadius: 20,
    borderWidth: 1,
  },
  searchIconWrapper: {
    flexDirection: 'row',
    width: 30,
    justifyContent: 'center',
    marginRight: 2,
  },
  searchInputWrapper: {
    flexDirection: 'row',
  },
  searchContainer: {
    flexWrap: 'wrap',
    position: 'relative',
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 6,
  },
  headerMenuBtn: {
    width: 40,
    height: 30,
    marginLeft: 6,
  },
  searchResultsContainer: {
    position: 'fixed',
    flex: 1,
    flexDirection: 'column',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 50,
  },
  headerSearchIcon: {
    marginRight: 6,
    alignSelf: 'center',
  },
  headerSearchInput: {
    flex: 1,
    fontSize: 17,
    width: '100%',
  },
  headerCancelBtn: {
    width: 60,
    paddingLeft: 10,
  },
  searchPrompt: {
    textAlign: 'center',
    paddingTop: 10,
  },
})
