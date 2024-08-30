import React, {useEffect, useRef} from 'react'
import {View} from 'react-native'
import {ImagePickerAsset} from 'expo-image-picker'

import {CompressedVideo} from '#/lib/media/video/types'
import {ExternalEmbedRemoveBtn} from 'view/com/composer/ExternalEmbedRemoveBtn'
import {atoms as a, useTheme} from '#/alf'

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
  const t = useTheme()
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

  const aspectRatio = asset.width / asset.height

  return (
    <View
      style={[
        a.w_full,
        a.rounded_sm,

        {aspectRatio: isNaN(aspectRatio) ? 16 / 9 : aspectRatio},
        a.overflow_hidden,
        {backgroundColor: t.palette.black},
      ]}>
      <ExternalEmbedRemoveBtn onRemove={clear} />
      <video
        ref={ref}
        src={video.uri}
        style={a.flex_1}
        autoPlay
        loop
        muted
        playsInline
      />
    </View>
  )
}
