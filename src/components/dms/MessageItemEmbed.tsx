import {memo} from 'react'
import {useWindowDimensions, View} from 'react-native'
import Animated, {
  interpolateColor,
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated'
import {type $Typed, type AppBskyEmbedRecord} from '@atproto/api'

import {atoms as a, native, useTheme, web} from '#/alf'
import {Embed, PostEmbedViewContext} from '#/components/Post/Embed'
import {MessageContextProvider} from './MessageContext'

const BORDER_RADIUS = 20
const SQUARED_BORDER_RADIUS = 4

let MessageItemEmbed = ({
  embed,
  isFromSelf,
  isGroupChat,
  squaredTopCorner,
  squaredBottomCorner,
  highlightSV,
}: {
  embed: $Typed<AppBskyEmbedRecord.View>
  isFromSelf: boolean
  isGroupChat: boolean
  squaredTopCorner: boolean
  squaredBottomCorner: boolean
  highlightSV: SharedValue<number>
}): React.ReactNode => {
  const t = useTheme()
  const screen = useWindowDimensions()

  const restingColor = isFromSelf ? t.palette.primary_50 : t.palette.contrast_50
  const highlightColor = isFromSelf
    ? t.palette.primary_300
    : t.palette.primary_100
  const highlightStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      highlightSV.get(),
      [0, 1],
      [restingColor, highlightColor],
    ),
  }))

  const radiiStyle = isFromSelf
    ? {
        borderBottomRightRadius: squaredBottomCorner
          ? SQUARED_BORDER_RADIUS
          : BORDER_RADIUS,
        borderTopRightRadius: squaredTopCorner
          ? SQUARED_BORDER_RADIUS
          : BORDER_RADIUS,
      }
    : {
        borderBottomLeftRadius: squaredBottomCorner
          ? SQUARED_BORDER_RADIUS
          : BORDER_RADIUS,
        borderTopLeftRadius: squaredTopCorner
          ? SQUARED_BORDER_RADIUS
          : BORDER_RADIUS,
      }

  return (
    <MessageContextProvider>
      <View
        style={[
          isFromSelf ? a.self_end : a.self_start,
          !isFromSelf && isGroupChat && a.ml_sm,
          native({
            flexBasis: 0,
            width: Math.min(screen.width, 600) / 1.4,
          }),
          web({
            width: '100%',
            minWidth: 280,
            maxWidth: 360,
          }),
        ]}>
        <Animated.View
          style={[a.rounded_xl, a.overflow_hidden, radiiStyle, highlightStyle]}>
          <Embed
            embed={embed}
            allowNestedQuotes
            viewContext={PostEmbedViewContext.ChatMessage}
            style={[a.rounded_xl, a.overflow_hidden, a.border_0, radiiStyle]}
          />
        </Animated.View>
      </View>
    </MessageContextProvider>
  )
}
MessageItemEmbed = memo(MessageItemEmbed)
export {MessageItemEmbed}
