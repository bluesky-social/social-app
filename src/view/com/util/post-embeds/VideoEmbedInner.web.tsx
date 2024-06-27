import React, {useEffect, useRef} from 'react'
import Hls from 'hls.js'

import {atoms as a} from '#/alf'

export const VideoEmbedInner = ({source}: {source: string}) => {
  const ref = useRef<HTMLVideoElement>(null)

  // Use HLS.js to play HLS video
  useEffect(() => {
    if (ref.current) {
      if (ref.current.canPlayType('application/vnd.apple.mpegurl')) {
        ref.current.src = source
      } else if (Hls.isSupported()) {
        var hls = new Hls()
        hls.loadSource(source)
        hls.attachMedia(ref.current)
      } else {
        // TODO: fallback
      }
    }
  }, [source])

  useEffect(() => {
    if (ref.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (ref.current) {
            if (entry.isIntersecting) {
              if (ref.current.paused) {
                ref.current.play()
              }
            } else {
              if (!ref.current.paused) {
                ref.current.pause()
              }
            }
          }
        },
        {threshold: 0},
      )

      observer.observe(ref.current)

      return () => {
        observer.disconnect()
      }
    }
  }, [])

  return <video ref={ref} style={a.flex_1} controls playsInline autoPlay loop />
}
