import React from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {type ImagePickerAsset} from 'expo-image-picker'
import {BlueskyVideoView} from '@haileyok/bluesky-video'
import {Trans} from '@lingui/macro'

import {type CompressedVideo} from '#/lib/media/video/types'
import {clamp} from '#/lib/numbers'
import {useAutoplayDisabled} from '#/state/preferences'
import {ExternalEmbedRemoveBtn} from '#/view/com/composer/ExternalEmbedRemoveBtn'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
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
  clear: () => void
}) {
  const t = useTheme()
  const playerRef = React.useRef<BlueskyVideoView>(null)
  const autoplayDisabled = useAutoplayDisabled()
  const isRestoredFromDraft = !video.uri

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
      {!isRestoredFromDraft && (
        <View style={[a.absolute, a.inset_0]}>
          <VideoTranscodeBackdrop uri={asset.uri} />
        </View>
      )}
      {isRestoredFromDraft ? (
        <View
          style={[
            a.absolute,
            a.inset_0,
            a.justify_center,
            a.align_center,
            a.gap_md,
          ]}>
          <PlayButtonIcon />
          <Text style={[a.text_center, {color: t.palette.white}]}>
            <Trans>Video uploaded and ready to post</Trans>
          </Text>
        </View>
      ) : (
        isActivePost && (
          <>
            {video.mimeType === 'image/gif' ? (
              <Image
                style={[a.flex_1]}
                autoplay={!autoplayDisabled}
                source={{uri: video.uri}}
                accessibilityIgnoresInvertColors
                cachePolicy="none"
              />
            ) : (
              <BlueskyVideoView
                url={video.uri}
                autoplay={!autoplayDisabled}
                beginMuted={true}
                forceTakeover={true}
                ref={playerRef}
              />
            )}
          </>
        )
      )}
      <ExternalEmbedRemoveBtn onRemove={clear} />
      {!isRestoredFromDraft && autoplayDisabled && (
        <View style={[a.absolute, a.inset_0, a.justify_center, a.align_center]}>
          <PlayButtonIcon />
        </View>
      )}
    </View>
  )
}
