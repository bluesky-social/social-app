import React, {useEffect, useState, useRef} from 'react'
import {StyleSheet, Text, TextInput, View} from 'react-native'
import {useSharedValue} from 'react-native-reanimated'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {ProfileFollows as ProfileFollowsComponent} from '../com/profile/ProfileFollows'
import {Selector} from '../com/util/Selector'
import {colors} from '../lib/styles'
import {ScreenParams} from '../routes'
import {useStores} from '../../state'

export const Contacts = ({navIdx, visible, params}: ScreenParams) => {
  const store = useStores()
  const selectorInterp = useSharedValue(0)

  useEffect(() => {
    if (visible) {
      store.nav.setTitle(navIdx, `Contacts`)
    }
  }, [store, visible])

  const [searchText, onChangeSearchText] = useState('')
  const inputRef = useRef<TextInput | null>(null)

  return (
    <View>
      <View style={styles.section}>
        <Text style={styles.title}>Contacts</Text>
      </View>
      <View style={styles.section}>
        <View style={styles.searchContainer}>
          <FontAwesomeIcon
            icon="magnifying-glass"
            size={16}
            style={styles.searchIcon}
          />
          <TextInput
            ref={inputRef}
            value={searchText}
            style={styles.searchInput}
            placeholder="Search"
            onChangeText={onChangeSearchText}
          />
        </View>
      </View>
      <Selector
        items={['All', 'Following', 'Scenes']}
        selectedIndex={0}
        swipeGestureInterp={selectorInterp}
      />
      {!!store.me.handle && <ProfileFollowsComponent name={store.me.handle} />}
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.white,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  searchContainer: {
    flexDirection: 'row',
    backgroundColor: colors.gray1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginHorizontal: 10,
    marginBottom: 6,
    borderRadius: 4,
  },
  searchIcon: {
    color: colors.gray5,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
  },
})
