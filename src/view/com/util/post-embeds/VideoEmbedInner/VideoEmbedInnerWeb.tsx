import React, {useEffect, useId, useRef, useState} from 'react'
import {View} from 'react-native'
import {AppBskyEmbedVideo} from '@atproto/api-prerelease'
import Hls from 'hls.js'

import {atoms as a} from '#/alf'
import {Controls} from './VideoWebControls'

export function VideoEmbedInnerWeb({
  embed,
  active,
  setActive,
  onScreen,
}: {
  embed: AppBskyEmbedVideo.View
  active: boolean
  setActive: () => void
  onScreen: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const ref = useRef<HTMLVideoElement>(null)
  const [focused, setFocused] = useState(false)
  const [hasSubtitleTrack, setHasSubtitleTrack] = useState(false)
  const figId = useId()

  const hlsRef = useRef<Hls | undefined>(undefined)

  useEffect(() => {
    if (!ref.current) return
    if (!Hls.isSupported()) throw new HLSUnsupportedError()

    const hls = new Hls({capLevelToPlayerSize: true})
    hlsRef.current = hls

    hls.attachMedia(ref.current)
    hls.loadSource(embed.playlist)

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
  }, [embed.playlist])

  return (
    <View style={[a.w_full, a.rounded_sm, a.overflow_hidden]}>
      <div
        ref={containerRef}
        style={{width: '100%', height: '100%', display: 'flex'}}>
        <figure>
          <video
            ref={ref}
            poster={embed.thumbnail}
            style={{width: '100%', height: '100%', objectFit: 'contain'}}
            playsInline
            preload="none"
            loop
            muted={!focused}
            aria-labelledby={embed.alt ? figId : undefined}
          />
          {embed.alt && <figcaption id={figId}>{embed.alt}</figcaption>}
        </figure>
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