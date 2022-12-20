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
import {Text} from '../com/util/Text'
import {ScreenParams} from '../routes'
import {useStores} from '../../state'
import {UserAutocompleteViewModel} from '../../state/models/user-autocomplete-view'
import {s, colors} from '../lib/styles'
import {MagnifyingGlassIcon} from '../lib/icons'

export const Search = ({navIdx, visible, params}: ScreenParams) => {
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
      textInput.current?.focus()
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
    <View style={styles.container}>
      <ViewHeader title="Search" />
      <View style={styles.inputContainer}>
        <MagnifyingGlassIcon style={styles.inputIcon} />
        <TextInput
          ref={textInput}
          placeholder="Type your query here..."
          placeholderTextColor={colors.gray4}
          selectTextOnFocus
          returnKeyType="search"
          style={styles.input}
          onChangeText={onChangeQuery}
        />
      </View>
      <View style={styles.outputContainer}>
        {query ? (
          <ScrollView onScroll={Keyboard.dismiss}>
            {autocompleteView.searchRes.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.searchResult}
                onPress={() => onSelect(item.handle)}>
                <UserAvatar
                  handle={item.handle}
                  displayName={item.displayName}
                  avatar={item.avatar}
                  size={36}
                />
                <View style={[s.ml10]}>
                  <Text style={styles.searchResultDisplayName}>
                    {item.displayName || item.handle}
                  </Text>
                  <Text style={styles.searchResultHandle}>@{item.handle}</Text>
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
    backgroundColor: colors.white,
  },

  inputContainer: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomColor: colors.gray1,
    borderBottomWidth: 1,
  },
  inputIcon: {
    marginRight: 10,
    color: colors.gray3,
    alignSelf: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.black,
  },

  outputContainer: {
    flex: 1,
    backgroundColor: colors.gray1,
  },

  searchResult: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray1,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  searchResultDisplayName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchResultHandle: {
    fontSize: 14,
    color: colors.gray5,
  },
})
