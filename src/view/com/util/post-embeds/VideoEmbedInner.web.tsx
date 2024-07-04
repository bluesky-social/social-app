import React, {useEffect, useRef, useState} from 'react'
import {View} from 'react-native'
import Hls from 'hls.js'

import {atoms as a, useTheme} from '#/alf'

export function VideoEmbedInner({
  source,
  active,
}: {
  source: string
  active: boolean
}) {
  const [hls] = useState(() => new Hls())
  const ref = useRef<HTMLVideoElement>(null)
  const t = useTheme()

  useEffect(() => {
    if (ref.current) {
      if (ref.current.canPlayType('application/vnd.apple.mpegurl')) {
        ref.current.src = source
      } else if (Hls.isSupported()) {
        hls.loadSource(source)
      } else {
        // TODO: fallback
      }
    }
  }, [source, hls])

  useEffect(() => {
    if (ref.current) {
      if (
        !ref.current.canPlayType('application/vnd.apple.mpegurl') &&
        Hls.isSupported()
      ) {
        hls.attachMedia(ref.current)
      }
    }
  }, [source, hls])

  return (
    <View
      style={[
        a.w_full,
        a.rounded_sm,
        {aspectRatio: 16 / 9},
        a.overflow_hidden,
        t.atoms.bg_contrast_25,
        a.my_xs,
      ]}>
      <video
        src={source}
        ref={ref}
        style={a.flex_1}
        playsInline
        preload="none"
        loop
        muted
        autoPlay={active}
      />
    </View>
  )
}
