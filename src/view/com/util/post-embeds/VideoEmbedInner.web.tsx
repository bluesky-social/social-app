import React, {useEffect, useRef, useState} from 'react'
import {View} from 'react-native'
import Hls from 'hls.js'

import {atoms as a} from '#/alf'

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

  const {play, pause, togglePlayPause} = useVideoUtils(ref)

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
    if (active) {
      play()
    }
    return () => {
      pause()
      setFocused(false)
    }
  }, [active, play, pause])

  useEffect(() => {
    if (!onScreen) {
      pause()
    }
  }, [onScreen, pause])

  return (
    <View
      style={[
        a.w_full,
        a.rounded_sm,
        {aspectRatio: 16 / 9},
        a.overflow_hidden,
      ]}>
      <div
        style={{
          position: 'absolute',
          top: 5,
          right: 5,
          borderRadius: '50%',
          width: 20,
          height: 20,
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
            togglePlayPause()
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

function useVideoUtils(ref: React.RefObject<HTMLVideoElement>) {
  const play = () => {
    if (!ref.current) return

    // this is how you check if the video is ready to play
    if (ref.current.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
      ref.current.play()
    } else {
      // TODO: find different solution. can sometimes cause double-playing
      ref.current.addEventListener('canplay', () => {
        ref.current?.play()
      })
    }
  }

  const pause = () => {
    if (!ref.current) return
    ref.current.pause()
  }

  const togglePlayPause = () => {
    if (!ref.current) return
    if (ref.current.paused) {
      play()
    } else {
      pause()
    }
  }

  return {play, pause, togglePlayPause}
}
