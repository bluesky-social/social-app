import React from 'react'
import {View} from 'react-native'
import {$Typed, AppBskyEmbedRecord} from '@atproto/api'

import {atoms as a, native, useTheme} from '#/alf'
import {PostEmbedViewContext} from '#/components/Post/Embed'
import {Embed} from '#/components/Post/Embed'
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
        <Embed
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
