import React from 'react'
import {View} from 'react-native'
import {ImagePickerAsset} from 'expo-image-picker'
import {BlueskyVideoView} from 'bluesky-video'

import {CompressedVideo} from '#/lib/media/video/types'
import {clamp} from '#/lib/numbers'
import {useAutoplayDisabled} from '#/state/preferences'
import {ExternalEmbedRemoveBtn} from 'view/com/composer/ExternalEmbedRemoveBtn'
import {atoms as a, useTheme} from '#/alf'
import {PlayButtonIcon} from '#/components/video/PlayButtonIcon'

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
      <BlueskyVideoView
        url={video.uri}
        style={a.flex_1}
        onStatusChange={e => {
          if (e.nativeEvent.status === 'readyToPlay') {
            // player.play()
          }
        }}
        onError={e => {
          console.error('error', e.nativeEvent.error)
        }}
        ref={playerRef}
        autoplay={!autoplayDisabled}
        // contentFit="contain"
      />
      <ExternalEmbedRemoveBtn onRemove={clear} />
      {autoplayDisabled && (
        <View style={[a.absolute, a.inset_0, a.justify_center, a.align_center]}>
          <PlayButtonIcon />
        </View>
      )}
    </View>
  )
}
