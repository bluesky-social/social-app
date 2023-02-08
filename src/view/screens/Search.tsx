import React, {useEffect, useState, useMemo, useRef} from 'react'
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import {observer} from 'mobx-react-lite'
import {SuggestedFollows} from '../com/discover/SuggestedFollows'
import {UserAvatar} from '../com/util/UserAvatar'
import {Text} from '../com/util/text/Text'
import {ScreenParams} from '../routes'
import {useStores} from '../../state'
import {UserAutocompleteViewModel} from '../../state/models/user-autocomplete-view'
import {s} from '../lib/styles'
import {MagnifyingGlassIcon} from '../lib/icons'
import {usePalette} from '../lib/hooks/usePalette'
import {useAnalytics} from '@segment/analytics-react-native'

const MENU_HITSLOP = {left: 10, top: 10, right: 30, bottom: 10}

export const Search = observer(({navIdx, visible, params}: ScreenParams) => {
  const pal = usePalette('default')
  const store = useStores()
  const {track} = useAnalytics()
  const textInput = useRef<TextInput>(null)
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false)
  const [query, setQuery] = useState<string>('')
  const autocompleteView = useMemo<UserAutocompleteViewModel>(
    () => new UserAutocompleteViewModel(store),
    [store],
  )
  const {name} = params

  useEffect(() => {
    if (visible) {
      store.shell.setMinimalShellMode(false)
      autocompleteView.setup()
      store.nav.setTitle(navIdx, 'Search')
    }
  }, [store, visible, name, navIdx, autocompleteView])

  const onPressMenu = () => {
    track('ViewHeader:MenuButtonClicked')
    store.shell.setMainMenuOpen(true)
  }

  const onChangeQuery = (text: string) => {
    setQuery(text)
    if (text.length > 0) {
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
  const onSelect = (handle: string) => {
    textInput.current?.blur()
    store.nav.navigate(`/profile/${handle}`)
  }
  const onPressContainer = () => {
    textInput.current?.blur()
  }

  return (
    <TouchableWithoutFeedback onPress={onPressContainer}>
      <View style={[pal.view, styles.container]}>
        <View style={[pal.view, pal.border, styles.header]}>
          <TouchableOpacity
            testID="viewHeaderBackOrMenuBtn"
            onPress={onPressMenu}
            hitSlop={MENU_HITSLOP}
            style={styles.headerMenuBtn}>
            <UserAvatar
              size={30}
              handle={store.me.handle}
              displayName={store.me.displayName}
              avatar={store.me.avatar}
            />
          </TouchableOpacity>
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
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              onChangeText={onChangeQuery}
            />
          </View>
          {query ? (
            <View style={styles.headerCancelBtn}>
              <TouchableOpacity onPress={onPressCancelSearch}>
                <Text>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : undefined}
        </View>
        <View style={styles.outputContainer}>
          {query && autocompleteView.searchRes.length ? (
            <ScrollView testID="searchScrollView" onScroll={Keyboard.dismiss}>
              {autocompleteView.searchRes.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={[pal.view, pal.border, styles.searchResult]}
                  onPress={() => onSelect(item.handle)}>
                  <UserAvatar
                    handle={item.handle}
                    displayName={item.displayName}
                    avatar={item.avatar}
                    size={36}
                  />
                  <View style={[s.ml10, s.flex1]}>
                    <Text type="title-sm" style={pal.text} numberOfLines={1}>
                      {item.displayName || item.handle}
                    </Text>
                    <Text style={pal.textLight} numberOfLines={1}>
                      @{item.handle}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
              <View style={s.footerSpacer} />
            </ScrollView>
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
          ) : (
            <SuggestedFollows asLinks />
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 5,
  },
  headerMenuBtn: {
    width: 40,
    height: 30,
    marginLeft: 6,
  },
  headerSearchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerSearchIcon: {
    marginRight: 6,
    alignSelf: 'center',
  },
  headerSearchInput: {
    flex: 1,
    fontSize: 16,
  },
  headerCancelBtn: {
    width: 60,
    paddingLeft: 10,
  },

  searchPrompt: {
    textAlign: 'center',
    paddingTop: 10,
  },

  outputContainer: {
    flex: 1,
  },
  searchResult: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
})
