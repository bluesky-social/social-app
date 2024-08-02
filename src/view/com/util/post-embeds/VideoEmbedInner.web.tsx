import React, {useCallback, useEffect, useRef, useState} from 'react'
import {View} from 'react-native'
import Hls from 'hls.js'

import {atoms as a} from '#/alf'
import {Controls} from './VideoWebControls'

export function VideoEmbedInner({
  active,
  sendPosition,
  isAnyViewActive,
  onGoFarOffScreen,
  ...props
}: {
  source: string
  active: boolean
  setActive: () => void
  sendPosition: (position: number) => void
  onScreen: boolean
  onGoFarOffScreen: () => void
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
        if (!entry.isIntersecting) {
          // unmounts the video player
          onGoFarOffScreen()
        }
      },
      {threshold: Array.from({length: 101}, (_, i) => i / 100)},
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [sendPosition, onGoFarOffScreen])

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
  const [hls] = useState(() => new Hls({capLevelToPlayerSize: true}))
  const containerRef = useRef<HTMLDivElement>(null)
  const ref = useRef<HTMLVideoElement>(null)
  const [focused, setFocused] = useState(false)
  const [hasSubtitleTrack, setHasSubtitleTrack] = useState(false)

  useEffect(() => {
    if (
      ref.current &&
      !ref.current.canPlayType('application/vnd.apple.mpegurl') &&
      Hls.isSupported()
    ) {
      hls.attachMedia(ref.current)
      // initial value, later on it's managed by Controls
      hls.autoLevelCapping = 0

      hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (event, data) => {
        if (data.subtitleTracks.length > 0) {
          setHasSubtitleTrack(true)
        }
      })

      return () => {
        hls.detachMedia()
      }
    }
  }, [hls])

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

  const enterFullscreen = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.requestFullscreen()
    }
  }, [])

  return (
    <View
      style={[
        a.w_full,
        a.rounded_sm,
        // TODO: get from embed metadata
        // max should be 1 / 1
        {aspectRatio: 16 / 9},
        a.overflow_hidden,
      ]}>
      <div
        ref={containerRef}
        style={{width: '100%', height: '100%', display: 'flex'}}>
        <video
          ref={ref}
          style={{width: '100%', height: '100%', objectFit: 'contain'}}
          playsInline
          preload="none"
          loop
          muted={!focused}
        />
        <Controls
          videoRef={ref}
          hls={hls}
          active={active}
          setActive={setActive}
          focused={focused}
          setFocused={setFocused}
          onScreen={onScreen}
          enterFullscreen={enterFullscreen}
          hasSubtitleTrack={hasSubtitleTrack}
        />
      </div>
    </View>
  )
}
