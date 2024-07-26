import React, {useEffect, useRef, useState} from 'react'
import {View} from 'react-native'
import Hls from 'hls.js'

import {atoms as a, useTheme} from '#/alf'

export function VideoEmbedInner({
  active,
  sendPosition,
  isAnyViewActive,
  ...props
}: {
  source: string
  active: boolean
  setActive: () => void
  sendPosition: (position: number) => void
  onScreen: boolean
  isAnyViewActive?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  // Send position when scrolling. This is done with an IntersectionObserver
  // observing a div of 100vh height
  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0]
        if (!entry) return
        const position =
          entry.boundingClientRect.y + entry.boundingClientRect.height / 2
        sendPosition(position)
      },
      {threshold: Array.from({length: 101}, (_, i) => i / 100)},
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [sendPosition])

  // In case scrolling hasn't started yet, send up the position
  useEffect(() => {
    if (ref.current && !isAnyViewActive) {
      const rect = ref.current.getBoundingClientRect()
      const position = rect.y + rect.height / 2
      sendPosition(position)
    }
  }, [isAnyViewActive, sendPosition])

  return (
    <View style={[a.flex_1, a.flex_row]}>
      <VideoPlayer active={active} {...props} />
      <div
        ref={ref}
        style={{
          position: 'absolute',
          top: 'calc(50% - 50vh)',
          left: '50%',
          height: '100vh',
          width: 1,
          pointerEvents: 'none',
        }}
      />
    </View>
  )
}

export function VideoPlayer({
  source,
  active,
  setActive,
  onScreen,
}: {
  source: string
  active: boolean
  setActive: () => void
  onScreen: boolean
}) {
  const [hls] = useState(() => new Hls())
  const ref = useRef<HTMLVideoElement>(null)
  const [focused, setFocused] = useState(false)
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
    if (
      ref.current &&
      !ref.current.canPlayType('application/vnd.apple.mpegurl') &&
      Hls.isSupported()
    ) {
      hls.attachMedia(ref.current)

      return () => {
        hls.detachMedia()
      }
    }
  }, [source, hls])

  useEffect(() => {
    if (!ref.current) return
    if (!onScreen || !active) {
      ref.current.pause()
      setFocused(false)
    }
  }, [onScreen, active])

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
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: active ? 'red' : 'blue',
          opacity: 0.5,
          pointerEvents: 'none',
        }}
      />
      <video
        src={source}
        ref={ref}
        style={a.flex_1}
        playsInline
        preload="none"
        loop
        muted={!focused}
        autoPlay={active}
        onClick={evt => {
          evt.stopPropagation()
          if (focused) {
            if (ref.current?.paused) {
              ref.current.play()
            } else {
              ref.current?.pause()
            }
          } else {
            if (!active) {
              setActive()
            }
            setFocused(true)
          }
        }}
      />
    </View>
  )
}
