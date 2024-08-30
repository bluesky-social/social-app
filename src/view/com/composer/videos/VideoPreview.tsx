/* eslint-disable @typescript-eslint/no-shadow */
import React from 'react'
import {View} from 'react-native'
import {ImagePickerAsset} from 'expo-image-picker'
import {useVideoPlayer, VideoView} from 'expo-video'

import {CompressedVideo} from '#/lib/media/video/types'
import {clamp} from '#/lib/numbers'
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

  let aspectRatio = asset.width / asset.height

  if (isNaN(aspectRatio)) {
    aspectRatio = 16 / 9
  }

  aspectRatio = clamp(aspectRatio, 1 / 1, 3 / 1)

  return (
    <View
      style={[
        a.w_full,
        a.rounded_sm,
        {aspectRatio},
        a.overflow_hidden,
        a.border,
        t.atoms.border_contrast_low,
        {backgroundColor: t.palette.black},
      ]}>
      <VideoView
        player={player}
        style={a.flex_1}
        allowsPictureInPicture={false}
        nativeControls={false}
        contentFit="contain"
      />
      <ExternalEmbedRemoveBtn onRemove={clear} />
    </View>
  )
}
