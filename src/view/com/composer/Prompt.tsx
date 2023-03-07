import React from 'react'
import {StyleSheet, TouchableOpacity} from 'react-native'
import {UserAvatar} from '../util/UserAvatar'
import {Text} from '../util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'

export function ComposePrompt({
  onPressCompose,
}: {
  onPressCompose: (imagesOpen?: boolean) => void
}) {
  const store = useStores()
  const pal = usePalette('default')
  return (
    <TouchableOpacity
      testID="replyPromptBtn"
      style={[pal.view, pal.border, styles.prompt]}
      onPress={() => onPressCompose()}>
      <UserAvatar
        handle={store.me.handle}
        avatar={store.me.avatar}
        displayName={store.me.displayName}
        size={38}
      />
      <Text type="xl" style={[pal.text, styles.label]}>
        Write your reply
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  prompt: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  label: {
    paddingLeft: 12,
  },
})
