import React from 'react'
import {View} from 'react-native'
import {$Typed,AppBskyEmbedRecord} from '@atproto/api'

import {PostEmbedViewContext} from '#/view/com/util/post-embeds'
import {atoms as a, native, useTheme} from '#/alf'
import {PostEmbed} from '#/components/embeds/PostEmbed'
import {MessageContextProvider} from './MessageContext'

let MessageItemEmbed = ({
  embed,
}: {
  embed: $Typed<AppBskyEmbedRecord.View>
}): React.ReactNode => {
  const t = useTheme()

  return (
    <MessageContextProvider>
      <View style={[a.my_xs, t.atoms.bg, native({flexBasis: 0})]}>
        <PostEmbed
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
