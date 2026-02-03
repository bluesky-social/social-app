import React from 'react'
import {useWindowDimensions, View} from 'react-native'
import {
  type $Typed,
  AppBskyEmbedImages,
  type AppBskyEmbedRecord,
  type ChatBskyConvoDefs,
} from '@atproto/api'

import {atoms as a, native, tokens, useTheme, web} from '#/alf'
import {Embed, PostEmbedViewContext} from '#/components/Post/Embed'
import {DMImageContentHider} from './DMImageContentHider'
import {MessageContextProvider} from './MessageContext'

let MessageItemEmbed = ({
  embed,
  message,
  convo,
}: {
  embed: $Typed<AppBskyEmbedRecord.View> | $Typed<AppBskyEmbedImages.View>
  message: ChatBskyConvoDefs.MessageView
  convo: ChatBskyConvoDefs.ConvoView
}): React.ReactNode => {
  const t = useTheme()
  const screen = useWindowDimensions()

  const embedContent = (
    <Embed
      embed={embed}
      allowNestedQuotes
      viewContext={PostEmbedViewContext.Feed}
    />
  )

  return (
    <MessageContextProvider>
      <View
        style={[
          a.my_xs,
          t.atoms.bg,
          a.rounded_md,
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
        <View style={{marginTop: tokens.space.sm * -1}}>
          {AppBskyEmbedImages.isView(embed) ? (
            <DMImageContentHider message={message} convo={convo}>
              {embedContent}
            </DMImageContentHider>
          ) : (
            embedContent
          )}
        </View>
      </View>
    </MessageContextProvider>
  )
}
MessageItemEmbed = React.memo(MessageItemEmbed)
export {MessageItemEmbed}
