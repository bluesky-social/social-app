/* eslint-disable @typescript-eslint/no-shadow */
import React from 'react'
import {View} from 'react-native'
import {useVideoPlayer, VideoView} from 'expo-video'

import {CompressedVideo} from '#/lib/media/video/compress'
import {ExternalEmbedRemoveBtn} from 'view/com/composer/ExternalEmbedRemoveBtn'
import {atoms as a, useTheme} from '#/alf'

export function VideoPreview({
  video,
  clear,
}: {
  video: CompressedVideo
  clear: () => void
}) {
  const t = useTheme()
  const player = useVideoPlayer(video.uri, player => {
    player.loop = true
    player.muted = true
    player.play()
  })

  return (
    <View
      style={[
        a.w_full,
        a.rounded_sm,
        {aspectRatio: 16 / 9},
        a.overflow_hidden,
        a.border,
        t.atoms.border_contrast_low,
      ]}>
      <VideoView
        player={player}
        style={a.flex_1}
        allowsPictureInPicture={false}
        nativeControls={false}
      />
      <ExternalEmbedRemoveBtn onRemove={clear} />
    </View>
  )
}
