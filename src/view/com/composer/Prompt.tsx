import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {colors} from '../../lib/styles'
import {useStores} from '../../../state'
import {UserAvatar} from '../util/UserAvatar'
import {Text} from '../util/text/Text'
import {usePalette} from '../../lib/hooks/usePalette'

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
  const pal = usePalette('default')
  const store = useStores()
  const onPressAvatar = () => {
    store.nav.navigate(`/profile/${store.me.handle}`)
  }
  return (
    <TouchableOpacity
      style={[
        pal.view,
        pal.border,
        styles.container,
        noAvi ? styles.noAviContainer : undefined,
      ]}
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
        <Text type="h5" style={[pal.textLight, {fontWeight: 'normal'}]}>
          {text}
        </Text>
      </View>
      <View style={[styles.btn, {backgroundColor: pal.colors.backgroundLight}]}>
        <Text type="button" style={pal.textLight}>
          {btn}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
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
  btn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 30,
  },
})
