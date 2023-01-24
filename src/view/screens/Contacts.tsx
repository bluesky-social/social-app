import React, {useEffect, useState, useRef} from 'react'
import {StyleSheet, TextInput, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {ProfileFollows as ProfileFollowsComponent} from '../com/profile/ProfileFollows'
import {Selector} from '../com/util/Selector'
import {Text} from '../com/util/text/Text'
import {colors} from '../lib/styles'
import {ScreenParams} from '../routes'
import {useStores} from '../../state'
import {useAnimatedValue} from '../lib/hooks/useAnimatedValue'

export const Contacts = ({navIdx, visible, params}: ScreenParams) => {
  const store = useStores()
  const selectorInterp = useAnimatedValue(0)

  useEffect(() => {
    if (visible) {
      store.nav.setTitle(navIdx, 'Contacts')
    }
  }, [store, visible])

  const [searchText, onChangeSearchText] = useState('')
  const inputRef = useRef<TextInput | null>(null)

  return (
    <View>
      <View style={styles.section}>
        <Text testID="contactsTitle" style={styles.title}>
          Contacts
        </Text>
      </View>
      <View style={styles.section}>
        <View style={styles.searchContainer}>
          <FontAwesomeIcon
            icon="magnifying-glass"
            size={16}
            style={styles.searchIcon}
          />
          <TextInput
            testID="contactsTextInput"
            ref={inputRef}
            value={searchText}
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor={colors.gray4}
            onChangeText={onChangeSearchText}
          />
        </View>
      </View>
      <Selector
        items={['All', 'Following', 'Scenes']}
        selectedIndex={0}
        panX={selectorInterp}
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
    color: colors.black,
  },
})
