import React from 'react'
import {View} from 'react-native'
import {ImagePickerAsset} from 'expo-image-picker'
import {BlueskyVideoView} from '@haileyok/bluesky-video'

import {CompressedVideo} from '#/lib/media/video/types'
import {clamp} from '#/lib/numbers'
import {useAutoplayDisabled} from '#/state/preferences'
import {ExternalEmbedRemoveBtn} from '#/view/com/composer/ExternalEmbedRemoveBtn'
import {atoms as a, useTheme} from '#/alf'
import {PlayButtonIcon} from '#/components/video/PlayButtonIcon'
import {VideoTranscodeBackdrop} from './VideoTranscodeBackdrop'

export function VideoPreview({
  asset,
  video,
  clear,
  isActivePost,
}: {
  asset: ImagePickerAsset
  video: CompressedVideo
  isActivePost: boolean
  setDimensions: (width: number, height: number) => void
  clear: () => void
}) {
  const t = useTheme()
  const playerRef = React.useRef<BlueskyVideoView>(null)
  const autoplayDisabled = useAutoplayDisabled()
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
        {backgroundColor: 'black'},
      ]}>
      <View style={[a.absolute, a.inset_0]}>
        <VideoTranscodeBackdrop uri={asset.uri} />
      </View>
      {isActivePost && (
        <BlueskyVideoView
          url={video.uri}
          autoplay={!autoplayDisabled}
          beginMuted={true}
          forceTakeover={true}
          ref={playerRef}
        />
      )}
      <ExternalEmbedRemoveBtn onRemove={clear} />
      {autoplayDisabled && (
        <View style={[a.absolute, a.inset_0, a.justify_center, a.align_center]}>
          <PlayButtonIcon />
        </View>
      )}
    </View>
  )
}
