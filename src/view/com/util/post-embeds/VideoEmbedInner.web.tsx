import React, {useEffect, useRef, useState} from 'react'
import {View} from 'react-native'
import Hls from 'hls.js'

import {atoms as a} from '#/alf'
import {Controls} from './VideoWebControls'

export function VideoEmbedInner({
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
  const containerRef = useRef<HTMLDivElement>(null)
  const ref = useRef<HTMLVideoElement>(null)
  const [focused, setFocused] = useState(false)
  const [hasSubtitleTrack, setHasSubtitleTrack] = useState(false)

  const hlsRef = useRef<Hls | undefined>(undefined)

  useEffect(() => {
    if (!ref.current) return
    if (!Hls.isSupported()) throw new HLSUnsupportedError()

    const hls = new Hls({
      // unsure whether to enable this -sfn
      // capLevelToPlayerSize: true,
      startLevel: 0,
    })
    hlsRef.current = hls

    hls.attachMedia(ref.current)
    hls.loadSource(source)

    // initial value, later on it's managed by Controls
    hls.autoLevelCapping = 0

    hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (event, data) => {
      if (data.subtitleTracks.length > 0) {
        setHasSubtitleTrack(true)
      }
    })

    return () => {
      hlsRef.current = undefined
      hls.detachMedia()
      hls.destroy()
    }
  }, [source])

  // HACK: modify cues to move them up a bit -sfn
  useEffect(() => {
    if (!ref.current) return
    function moveCues() {
      if (!ref.current) return
      try {
        for (let i = 0; i < ref.current.textTracks.length; i++) {
          const track = ref.current.textTracks[i]
          console.log(track)
          if (!track.cues) continue
          for (let j = 0; j < track.cues.length; j++) {
            const cue = track.cues[j]
            console.log(cue)
            if (cue instanceof VTTCue) {
              if (cue.line === 'auto') {
                cue.line = -2
              }
            }
          }
        }
      } catch (err) {
        console.log(err)
      }
    }

    moveCues()

    const current = ref.current
    current.textTracks.addEventListener('change', moveCues)

    return () => {
      current.textTracks.removeEventListener('change', moveCues)
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
          hlsRef={hlsRef}
          active={active}
          setActive={setActive}
          focused={focused}
          setFocused={setFocused}
          onScreen={onScreen}
          fullscreenRef={containerRef}
          hasSubtitleTrack={hasSubtitleTrack}
        />
      </div>
    </View>
  )
}

export class HLSUnsupportedError extends Error {
  constructor() {
    super('HLS is not supported')
  }
}
