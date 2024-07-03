import React, {useEffect, useRef, useState} from 'react'
import {View} from 'react-native'
import Hls from 'hls.js'

import {atoms as a, useTheme} from '#/alf'
import {useActiveVideoView} from './ActiveVideoContext'

export function VideoEmbed({source}: {source: string}) {
  const [hls] = useState(() => new Hls())
  const hasLoaded = useRef(false)
  const {active, setActive, requestActive, allowUsurp} =
    useActiveVideoView(source)
  const ref = useRef<HTMLVideoElement>(null)
  const t = useTheme()

  // Use HLS.js to play HLS video
  useEffect(() => {
    if (ref.current && active && !hasLoaded.current) {
      hasLoaded.current = true
      if (ref.current.canPlayType('application/vnd.apple.mpegurl')) {
        ref.current.src = source
      } else if (Hls.isSupported()) {
        hls.loadSource(source)
        hls.attachMedia(ref.current)
      } else {
        // TODO: fallback
      }
    }
  }, [source, active, hls])

  useEffect(() => {
    return () => {
      hls.destroy()
    }
  }, [hls])

  useEffect(() => {
    if (ref.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (ref.current) {
            if (entry.intersectionRatio > 0.25) {
              if (active) {
                if (ref.current.paused) {
                  ref.current.play()
                }
              } else {
                requestActive(entry.boundingClientRect.y)
              }
            } else {
              if (active) {
                if (!ref.current.paused) {
                  ref.current.pause()
                }
              }
            }

            if (entry.intersectionRatio < 0.75) {
              allowUsurp()
            }
          }
        },
        {threshold: [0, 0.25, 1]},
      )

      observer.observe(ref.current)

      return () => {
        observer.disconnect()
      }
    }
  }, [active, requestActive, allowUsurp])

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
