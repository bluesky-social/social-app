import {View} from 'react-native'
import {type ImagePickerAsset} from 'expo-image-picker'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {type CompressedVideo} from '#/lib/media/video/types'
import {clamp} from '#/lib/numbers'
import {useAutoplayDisabled} from '#/state/preferences'
import {ExternalEmbedRemoveBtn} from '#/view/com/composer/ExternalEmbedRemoveBtn'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {PlayButtonIcon} from '#/components/video/PlayButtonIcon'

export function VideoPreview({
  asset,
  video,

  clear,
}: {
  asset: ImagePickerAsset
  video: CompressedVideo

  clear: () => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  // TODO: figure out how to pause a GIF for reduced motion
  // it's not possible using an img tag -sfn
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
        {backgroundColor: 'black'},
        a.relative,
      ]}>
      <ExternalEmbedRemoveBtn onRemove={clear} />
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
      ) : video.mimeType === 'image/gif' ? (
        <img
          src={video.uri}
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
          alt="GIF"
        />
      ) : (
        <>
          <video
            src={video.uri}
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
            autoPlay={!autoplayDisabled}
            loop
            muted
            playsInline
            onError={err => {
              console.error('Error loading video', err)
              Toast.show(_(msg`Could not process your video`), 'xmark')
              clear()
            }}
          />
          {autoplayDisabled && (
            <View
              style={[a.absolute, a.inset_0, a.justify_center, a.align_center]}>
              <PlayButtonIcon />
            </View>
          )}
        </>
      )}
    </View>
  )
}
