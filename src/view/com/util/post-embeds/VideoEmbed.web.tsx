import React, {useCallback, useEffect, useRef, useState} from 'react'
import {View} from 'react-native'
import Hls from 'hls.js'

import {atoms as a, useTheme} from '#/alf'
import {useActiveVideoView} from './ActiveVideoContext'

export function VideoEmbed({source}: {source: string}) {
  const [hls] = useState(() => new Hls())
  const hasLoaded = useRef(false)
  const ref = useRef<HTMLVideoElement>(null)
  const {active, setActive} = useActiveVideoView({
    source,
    measure: useCallback(() => {
      if (ref.current) {
        return ref.current.getBoundingClientRect()
      }
    }, []),
  })
  const t = useTheme()

  useEffect(() => {
    if (ref.current && active && !hasLoaded.current) {
      hasLoaded.current = true
      if (ref.current.canPlayType('application/vnd.apple.mpegurl')) {
        ref.current.src = source
      } else if (Hls.isSupported()) {
        hls.loadSource(source)
      } else {
        // TODO: fallback
      }
    }
  }, [source, active, hls])

  useEffect(() => {
    if (ref.current) {
      if (
        !ref.current.canPlayType('application/vnd.apple.mpegurl') &&
        Hls.isSupported()
      ) {
        hls.attachMedia(ref.current)
      }
    }
  }, [source, active, hls])

  return (
    <View
      style={[
        a.w_full,
        a.rounded_sm,
        {aspectRatio: 16 / 9},
        a.overflow_hidden,
        active ? t.atoms.bg_contrast_25 : t.atoms.bg_contrast_200,
        a.my_xs,
      ]}>
      <video
        ref={ref}
        style={a.flex_1}
        playsInline
        preload="none"
        loop
        muted
        autoPlay={active}
        onClick={() => {
          if (!active) {
            setActive()
          }
        }}
      />
    </View>
  )
}
