import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {Text} from '../util/text/Text'
import {usePalette} from '../../lib/hooks/usePalette'

export function ComposePrompt({
  text = "What's up?",
  btn = 'Post',
  isReply = false,
  onPressCompose,
}: {
  text?: string
  btn?: string
  isReply?: boolean
  onPressCompose: () => void
}) {
  const pal = usePalette('default')
  return (
    <TouchableOpacity
      style={[
        pal.view,
        pal.border,
        styles.container,
        isReply ? styles.containerReply : undefined,
      ]}
      onPress={onPressCompose}>
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
    paddingLeft: 4,
    paddingRight: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  containerReply: {
    paddingHorizontal: 10,
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
