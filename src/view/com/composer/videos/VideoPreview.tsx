/* eslint-disable @typescript-eslint/no-shadow */
import React from 'react'
import {View} from 'react-native'
import {ImagePickerAsset} from 'expo-image-picker'
import {useVideoPlayer, VideoView} from 'expo-video'

import {CompressedVideo} from '#/lib/media/video/compress'
import {ExternalEmbedRemoveBtn} from 'view/com/composer/ExternalEmbedRemoveBtn'
import {atoms as a, useTheme} from '#/alf'

export function VideoPreview({
  asset,
  video,
  clear,
}: {
  asset: ImagePickerAsset
  video: CompressedVideo
  setDimensions: (width: number, height: number) => void
  clear: () => void
}) {
  const t = useTheme()
  const player = useVideoPlayer(video.uri, player => {
    player.loop = true
    player.muted = true
    player.play()
  })

  const aspectRatio = asset.width / asset.height

  return (
    <View
      style={[
        a.w_full,
        a.rounded_sm,
        {aspectRatio: isNaN(aspectRatio) ? 16 / 9 : aspectRatio},
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
