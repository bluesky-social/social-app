import React from 'react'
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import {colors} from '../../lib/styles'
import {useStores} from '../../../state'
import {UserAvatar} from '../util/UserAvatar'

export function ComposePrompt({
  noAvi = false,
  text = "What's up?",
  btn = 'Post',
  onPressCompose,
}: {
  noAvi?: boolean
  text?: string
  btn?: string
  onPressCompose: () => void
}) {
  const store = useStores()
  const onPressAvatar = () => {
    store.nav.navigate(`/profile/${store.me.handle}`)
  }
  return (
    <TouchableOpacity
      style={[styles.container, noAvi ? styles.noAviContainer : undefined]}
      onPress={onPressCompose}>
      {!noAvi ? (
        <TouchableOpacity style={styles.avatar} onPress={onPressAvatar}>
          <UserAvatar
            size={50}
            handle={store.me.handle || ''}
            displayName={store.me.displayName}
            avatar={store.me.avatar}
          />
        </TouchableOpacity>
      ) : undefined}
      <View style={styles.textContainer}>
        <Text style={styles.text}>{text}</Text>
      </View>
      <View style={styles.btn}>
        <Text style={styles.btnText}>{btn}</Text>
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
  noAviContainer: {
    paddingVertical: 14,
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
