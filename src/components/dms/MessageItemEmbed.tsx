import React from 'react'
import {View} from 'react-native'
import {AppBskyEmbedRecord} from '@atproto/api'

import {PostEmbeds} from '#/view/com/util/post-embeds'
import {atoms as a, native, useTheme} from '#/alf'

let MessageItemEmbed = ({
  embed,
}: {
  embed: AppBskyEmbedRecord.View
}): React.ReactNode => {
  const t = useTheme()

  return (
    <View style={[a.my_xs, t.atoms.bg, native({flexBasis: 0})]}>
      <PostEmbeds embed={embed} allowNestedQuotes />
    </View>
  )
}
MessageItemEmbed = React.memo(MessageItemEmbed)
export {MessageItemEmbed}
