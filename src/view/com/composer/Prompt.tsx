import React from 'react'
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {colors} from '../../lib/styles'
import {useStores} from '../../../state'
import {UserAvatar} from '../util/UserAvatar'

export function ComposePrompt({onPressCompose}: {onPressCompose: () => void}) {
  const store = useStores()
  const onPressAvatar = () => {
    store.nav.navigate(`/profile/${store.me.handle}`)
  }
  return (
    <TouchableOpacity style={styles.container} onPress={onPressCompose}>
      <TouchableOpacity style={styles.avatar} onPress={onPressAvatar}>
        <UserAvatar
          size={50}
          handle={store.me.handle || ''}
          displayName={store.me.displayName}
        />
      </TouchableOpacity>
      <View style={styles.textContainer}>
        <Text style={styles.text}>What's happening?</Text>
      </View>
      <View style={styles.btn}>
        <Text style={styles.btnText}>Post</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 6,
    margin: 2,
    marginBottom: 0,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  avatar: {
    width: 50,
  },
  textContainer: {
    marginLeft: 10,
    flex: 1,
  },
  text: {
    color: colors.gray4,
    fontSize: 17,
  },
  btn: {
    backgroundColor: colors.gray1,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 30,
  },
  btnText: {
    color: colors.gray5,
  },
})
