import {useEffect, useRef} from 'react'
import {View} from 'react-native'
import {ImagePickerAsset} from 'expo-image-picker'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {CompressedVideo} from '#/lib/media/video/types'
import {clamp} from '#/lib/numbers'
import {useAutoplayDisabled} from '#/state/preferences'
import {ExternalEmbedRemoveBtn} from '#/view/com/composer/ExternalEmbedRemoveBtn'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a} from '#/alf'
import {PlayButtonIcon} from '#/components/video/PlayButtonIcon'

const MAX_DURATION = 60

export function VideoPreview({
  asset,
  video,
  setDimensions,
  clear,
}: {
  asset: ImagePickerAsset
  video: CompressedVideo
  setDimensions: (width: number, height: number) => void
  clear: () => void
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const {_} = useLingui()
  const autoplayDisabled = useAutoplayDisabled()

  useEffect(() => {
    if (!ref.current) return

    const abortController = new AbortController()
    const {signal} = abortController
    ref.current.addEventListener(
      'loadedmetadata',
      function () {
        setDimensions(this.videoWidth, this.videoHeight)
        if (!isNaN(this.duration)) {
          if (this.duration > MAX_DURATION) {
            Toast.show(
              _(msg`Videos must be less than 60 seconds long`),
              'xmark',
            )
            clear()
          }
        }
      },
      {signal},
    )
    ref.current.addEventListener(
      'error',
      () => {
        Toast.show(_(msg`Could not process your video`), 'xmark')
        clear()
      },
      {signal},
    )

    return () => {
      abortController.abort()
    }
  }, [setDimensions, _, clear])

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
      <video
        ref={ref}
        src={video.uri}
        style={{width: '100%', height: '100%', objectFit: 'cover'}}
        autoPlay={!autoplayDisabled}
        loop
        muted
        playsInline
      />
      {autoplayDisabled && (
        <View style={[a.absolute, a.inset_0, a.justify_center, a.align_center]}>
          <PlayButtonIcon />
        </View>
      )}
    </View>
  )
}
