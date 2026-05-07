import {memo} from 'react'
import {useWindowDimensions, View} from 'react-native'
import {type $Typed, type AppBskyEmbedRecord} from '@atproto/api'

import {atoms as a, native, useTheme, web} from '#/alf'
import {Embed, PostEmbedViewContext} from '#/components/Post/Embed'
import {MessageContextProvider} from './MessageContext'

const CLUSTERED_MESSAGE_GAP = 2
const BORDER_RADIUS = 20
const SQUARED_BORDER_RADIUS = 4

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
            marginTop: CLUSTERED_MESSAGE_GAP,
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
                      ? SQUARED_BORDER_RADIUS
                      : BORDER_RADIUS,
                    borderTopRightRadius: squaredTopCorner
                      ? SQUARED_BORDER_RADIUS
                      : BORDER_RADIUS,
                  }
                : {
                    backgroundColor: t.palette.contrast_50,
                    borderBottomLeftRadius: squaredBottomCorner
                      ? SQUARED_BORDER_RADIUS
                      : BORDER_RADIUS,
                    borderTopLeftRadius: squaredTopCorner
                      ? SQUARED_BORDER_RADIUS
                      : BORDER_RADIUS,
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
