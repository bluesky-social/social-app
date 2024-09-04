import React, {useEffect, useRef} from 'react'
import {View} from 'react-native'
import {ImagePickerAsset} from 'expo-image-picker'

import {CompressedVideo} from '#/lib/media/video/types'
import {clamp} from '#/lib/numbers'
import {ExternalEmbedRemoveBtn} from 'view/com/composer/ExternalEmbedRemoveBtn'
import {atoms as a} from '#/alf'

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

  useEffect(() => {
    if (!ref.current) return

    const abortController = new AbortController()
    const {signal} = abortController
    ref.current.addEventListener(
      'loadedmetadata',
      function () {
        setDimensions(this.videoWidth, this.videoHeight)
      },
      {signal},
    )

    return () => {
      abortController.abort()
    }
  }, [setDimensions])

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
      ]}>
      <ExternalEmbedRemoveBtn onRemove={clear} />
      <video
        ref={ref}
        src={video.uri}
        style={{width: '100%', height: '100%', objectFit: 'cover'}}
        autoPlay
        loop
        muted
        playsInline
      />
    </View>
  )
}
