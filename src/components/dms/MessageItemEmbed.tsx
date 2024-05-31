import React from 'react'
import {View} from 'react-native'
import {AppBskyEmbedRecord} from '@atproto/api'

import {PostEmbeds} from '#/view/com/util/post-embeds'
import {atoms as a, useTheme} from '#/alf'

let MessageItemEmbed = ({
  embed,
}: {
  embed: AppBskyEmbedRecord.View
}): React.ReactNode => {
  const t = useTheme()

  return (
    <View style={[a.my_xs, a.w_full, t.atoms.bg, a.rounded_md]}>
      <PostEmbeds
        embed={embed}
        quoteTextStyle={[a.text_sm, t.atoms.text_contrast_high]}
      />
    </View>
  )
}
MessageItemEmbed = React.memo(MessageItemEmbed)
export {MessageItemEmbed}
