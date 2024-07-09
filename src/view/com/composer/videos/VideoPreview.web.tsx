import React from 'react'
import {View} from 'react-native'

import {CompressedVideo} from '#/lib/media/video/compress'
import {ExternalEmbedRemoveBtn} from 'view/com/composer/ExternalEmbedRemoveBtn'
import {atoms as a} from '#/alf'

export function VideoPreview({
  video,
  clear,
}: {
  video: CompressedVideo
  clear: () => void
}) {
  return (
    <View
      style={[
        a.w_full,
        a.rounded_sm,
        {aspectRatio: 16 / 9},
        a.overflow_hidden,
      ]}>
      <ExternalEmbedRemoveBtn onRemove={clear} />
      <video src={video.uri} style={a.flex_1} autoPlay loop muted playsInline />
    </View>
  )
}
