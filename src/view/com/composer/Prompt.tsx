import React from 'react'
import {StyleSheet, TouchableOpacity} from 'react-native'
import {UserAvatar} from '../util/UserAvatar'
import {Text} from '../util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {isDesktopWeb} from 'platform/detection'

export function ComposePrompt({onPressCompose}: {onPressCompose: () => void}) {
  const store = useStores()
  const pal = usePalette('default')
  return (
    <TouchableOpacity
      testID="replyPromptBtn"
      style={[pal.view, pal.border, styles.prompt]}
      onPress={() => onPressCompose()}>
      <UserAvatar avatar={store.me.avatar} size={38} />
      <Text
        type="xl"
        style={[
          pal.text,
          isDesktopWeb ? styles.labelDesktopWeb : styles.labelMobile,
        ]}>
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
  labelMobile: {
    paddingLeft: 12,
  },
  labelDesktopWeb: {
    paddingLeft: 20,
  },
})
