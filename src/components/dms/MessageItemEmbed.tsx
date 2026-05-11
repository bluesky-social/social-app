import {memo} from 'react'
import {useWindowDimensions, View} from 'react-native'
import {type $Typed, type AppBskyEmbedRecord} from '@atproto/api'

import {atoms as a, native, useTheme, web} from '#/alf'
import {Embed, PostEmbedViewContext} from '#/components/Post/Embed'
import {MessageContextProvider} from './MessageContext'
import {BUBBLE_GAP, BUBBLE_RADIUS, BUBBLE_RADIUS_SHARP} from './util'

let MessageItemEmbed = ({
  embed,
  isFromSelf,
  squaredTopCorner,
  squaredBottomCorner,
}: {
  embed: $Typed<AppBskyEmbedRecord.View>
  isFromSelf: boolean
  squaredTopCorner: boolean
  squaredBottomCorner: boolean
}): React.ReactNode => {
  const t = useTheme()
  const screen = useWindowDimensions()

  return (
    <MessageContextProvider>
      <View
        style={[
          !isFromSelf && a.ml_sm,
          native({
            flexBasis: 0,
            width: Math.min(screen.width, 600) / 1.4,
          }),
          web({
            width: '100%',
            minWidth: 280,
            maxWidth: 360,
          }),
          {
            marginBottom: BUBBLE_GAP,
          },
        ]}>
        <View style={{marginTop: -8}}>
          <Embed
            embed={embed}
            allowNestedQuotes
            viewContext={PostEmbedViewContext.ChatMessage}
            style={[
              a.rounded_xl,
              a.overflow_hidden,
              a.border_0,
              isFromSelf
                ? {
                    backgroundColor: t.palette.primary_50,
                    borderBottomRightRadius: squaredBottomCorner
                      ? BUBBLE_RADIUS_SHARP
                      : BUBBLE_RADIUS,
                    borderTopRightRadius: squaredTopCorner
                      ? BUBBLE_RADIUS_SHARP
                      : BUBBLE_RADIUS,
                  }
                : {
                    backgroundColor: t.palette.contrast_50,
                    borderBottomLeftRadius: squaredBottomCorner
                      ? BUBBLE_RADIUS_SHARP
                      : BUBBLE_RADIUS,
                    borderTopLeftRadius: squaredTopCorner
                      ? BUBBLE_RADIUS_SHARP
                      : BUBBLE_RADIUS,
                  },
            ]}
          />
        </View>
      </View>
    </MessageContextProvider>
  )
}
MessageItemEmbed = memo(MessageItemEmbed)
export {MessageItemEmbed}
