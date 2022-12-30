import React, {useEffect, useState, useMemo, useRef} from 'react'
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import {ViewHeader} from '../com/util/ViewHeader'
import {SuggestedFollows} from '../com/discover/SuggestedFollows'
import {UserAvatar} from '../com/util/UserAvatar'
import {Text} from '../com/util/text/Text'
import {ScreenParams} from '../routes'
import {useStores} from '../../state'
import {UserAutocompleteViewModel} from '../../state/models/user-autocomplete-view'
import {s} from '../lib/styles'
import {MagnifyingGlassIcon} from '../lib/icons'
import {usePalette} from '../lib/hooks/usePalette'

export const Search = ({navIdx, visible, params}: ScreenParams) => {
  const pal = usePalette('default')
  const store = useStores()
  const textInput = useRef<TextInput>(null)
  const [query, setQuery] = useState<string>('')
  const autocompleteView = useMemo<UserAutocompleteViewModel>(
    () => new UserAutocompleteViewModel(store),
    [],
  )
  const {name} = params

  useEffect(() => {
    if (visible) {
      store.shell.setMinimalShellMode(false)
      autocompleteView.setup()
      store.nav.setTitle(navIdx, `Search`)
    }
  }, [store, visible, name])

  const onChangeQuery = (text: string) => {
    setQuery(text)
    if (text.length > 0) {
      autocompleteView.setActive(true)
      autocompleteView.setPrefix(text)
    } else {
      autocompleteView.setActive(false)
    }
  }
  const onSelect = (handle: string) => {
    textInput.current?.blur()
    store.nav.navigate(`/profile/${handle}`)
  }

  return (
    <View style={[pal.view, styles.container]}>
      <ViewHeader title="Search" />
      <View style={[pal.view, pal.border, styles.inputContainer]}>
        <MagnifyingGlassIcon style={[pal.text, styles.inputIcon]} />
        <TextInput
          ref={textInput}
          placeholder="Type your query here..."
          placeholderTextColor={pal.textLight}
          selectTextOnFocus
          returnKeyType="search"
          style={[pal.text, styles.input]}
          onChangeText={onChangeQuery}
        />
      </View>
      <View style={styles.outputContainer}>
        {query ? (
          <ScrollView onScroll={Keyboard.dismiss}>
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
                <View style={[s.ml10]}>
                  <Text type="h5" style={pal.text}>
                    {item.displayName || item.handle}
                  </Text>
                  <Text style={pal.textLight}>@{item.handle}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <SuggestedFollows asLinks />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  inputContainer: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  inputIcon: {
    marginRight: 10,
    alignSelf: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
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
