import React from 'react'
import {View} from 'react-native'
import {AppBskyEmbedRecord} from '@atproto/api'

import {PostEmbeds, PostEmbedViewContext} from '#/view/com/util/post-embeds'
import {atoms as a, native, useTheme} from '#/alf'
import {MessageContextProvider} from './MessageContext'

let MessageItemEmbed = ({
  embed,
}: {
  embed: AppBskyEmbedRecord.View
}): React.ReactNode => {
  const t = useTheme()

  return (
    <MessageContextProvider>
      <View style={[a.my_xs, t.atoms.bg, native({flexBasis: 0})]}>
        <PostEmbeds
          embed={embed}
          allowNestedQuotes
          viewContext={PostEmbedViewContext.Feed}
        />
      </View>
    </MessageContextProvider>
  )
}
MessageItemEmbed = React.memo(MessageItemEmbed)
export {MessageItemEmbed}
