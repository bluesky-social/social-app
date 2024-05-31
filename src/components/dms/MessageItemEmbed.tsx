import React from 'react'
import {View} from 'react-native'
import {AppBskyEmbedRecord} from '@atproto/api'

import {isNative} from '#/platform/detection'
import {PostEmbeds} from '#/view/com/util/post-embeds'
import {atoms as a, useTheme} from '#/alf'

let MessageItemEmbed = ({
  embed,
}: {
  embed: AppBskyEmbedRecord.View
}): React.ReactNode => {
  const t = useTheme()

  return (
    <View
      style={[a.my_xs, t.atoms.bg, a.rounded_md, isNative && {flexBasis: 0}]}>
      <PostEmbeds embed={embed} />
    </View>
  )
}
MessageItemEmbed = React.memo(MessageItemEmbed)
export {MessageItemEmbed}
