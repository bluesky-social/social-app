import React from 'react'
import {useWindowDimensions, View} from 'react-native'
import {AppBskyEmbedRecord} from '@atproto/api'

import {PostEmbeds, PostEmbedViewContext} from '#/view/com/util/post-embeds'
import {atoms as a, native, tokens, useTheme, web} from '#/alf'
import {MessageContextProvider} from './MessageContext'

let MessageItemEmbed = ({
  embed,
}: {
  embed: AppBskyEmbedRecord.View
}): React.ReactNode => {
  const t = useTheme()
  const screen = useWindowDimensions()

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
          <PostEmbeds
            embed={embed}
            allowNestedQuotes
            viewContext={PostEmbedViewContext.Feed}
          />
        </View>
      </View>
    </MessageContextProvider>
  )
}
MessageItemEmbed = React.memo(MessageItemEmbed)
export {MessageItemEmbed}
