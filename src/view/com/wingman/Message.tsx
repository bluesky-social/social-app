import React from 'react'
import {Pressable, StyleProp, View, ViewStyle, Text} from 'react-native'
import {UserMessage} from './types'

import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {StyleSheet} from 'react-native'

interface Props {
  message: UserMessage
  position: 'left' | 'right'
  style?: StyleProp<ViewStyle>
}

export const MessageRow = function Message({message, position, style}: Props) {
  const alignStyle = getBubblePositionStyle(position)

  return (
    <View style={[s.flex1, style]} key={message.messageId}>
      <Bubble message={message} style={[alignStyle]} />
    </View>
  )
}

const bubblePositionStyle = {
  left: {alignSelf: 'flex-start'},
  right: {alignSelf: 'flex-end'},
}

function getBubblePositionStyle(position: 'left' | 'right') {
  return position === 'left'
    ? (bubblePositionStyle.left as ViewStyle)
    : (bubblePositionStyle.right as ViewStyle)
}

const BUBBLE_CONTENT_PADDING = 10

function Bubble({
  message,
  style,
}: {
  message: UserMessage
  style?: StyleProp<ViewStyle>
}) {
  const pal = usePalette('default')

  return (
    <View style={[s.flex1, styles.root, style]}>
      <Pressable
        style={[styles.bubble, s.p10]}
        accessibilityRole="button"
        accessibilityLabel="TODO"
        accessibilityHint="TODO">
        <Text style={[pal.textInverted]}>{message.content}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flexShrink: 1,
    maxWidth: '80%',
  },
  bubble: {
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    padding: BUBBLE_CONTENT_PADDING,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
})
