import React, {useEffect, useId, useRef, useState} from 'react'
import {View} from 'react-native'
import {AppBskyEmbedVideo} from '@atproto/api'
import Hls, {Events, FragChangedData, Fragment} from 'hls.js'

import {atoms as a} from '#/alf'
import {MediaInsetBorder} from '#/components/MediaInsetBorder'
import {Controls} from './web-controls/VideoControls'

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
  const videoRef = useRef<HTMLVideoElement>(null)
  const [focused, setFocused] = useState(false)
  const [hasSubtitleTrack, setHasSubtitleTrack] = useState(false)
  const figId = useId()

  // send error up to error boundary
  const [error, setError] = useState<Error | null>(null)
  if (error) {
    throw error
  }

  const hlsRef = useRef<Hls | undefined>(undefined)
  const [lowQualityFragments, setLowQualityFragments] = useState<Fragment[]>([])

  useEffect(() => {
    if (!videoRef.current) return
    if (!Hls.isSupported()) throw new HLSUnsupportedError()

    const hls = new Hls({
      maxMaxBufferLength: 10, // only load 10s ahead
      // note: the amount buffered is affected by both maxBufferLength and maxBufferSize
      // it will buffer until it it's greater than *both* of those values
      // so we use maxMaxBufferLength to set the actual maximum amount of buffering instead
    })
    hlsRef.current = hls

    hls.attachMedia(videoRef.current)
    hls.loadSource(embed.playlist)

    // initial value, later on it's managed by Controls
    hls.autoLevelCapping = 0

    hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (_event, data) => {
      if (data.subtitleTracks.length > 0) {
        setHasSubtitleTrack(true)
      }
    })

    hls.on(Hls.Events.FRAG_BUFFERED, (_event, {frag}) => {
      if (frag.level === 0) {
        setLowQualityFragments(prev => [...prev, frag])
      }
    })

    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) {
        if (
          data.details === 'manifestLoadError' &&
          data.response?.code === 404
        ) {
          setError(new VideoNotFoundError())
        } else {
          setError(data.error)
        }
      } else {
        console.error(data.error)
      }
    })

    return () => {
      hlsRef.current = undefined
      hls.detachMedia()
      hls.destroy()
    }
  }, [embed.playlist])

  // purge low quality segments from buffer on next frag change
  useEffect(() => {
    if (!hlsRef.current) return

    const current = hlsRef.current

    if (focused) {
      function fragChanged(
        _event: Events.FRAG_CHANGED,
        {frag}: FragChangedData,
      ) {
        if (!hlsRef.current) return

        // if the current quality level goes above 0, flush the low quality segments
        if (hlsRef.current.nextAutoLevel > 0) {
          const flushed: Fragment[] = []

          for (const lowQualFrag of lowQualityFragments) {
            // avoid if close to the current fragment
            if (Math.abs(frag.start - lowQualFrag.start) < 0.1) {
              return
            }

            hlsRef.current.trigger(Hls.Events.BUFFER_FLUSHING, {
              startOffset: lowQualFrag.start,
              endOffset: lowQualFrag.end,
              type: 'video',
            })

            flushed.push(lowQualFrag)
          }

          setLowQualityFragments(prev => prev.filter(f => !flushed.includes(f)))
        }
      }
      current.on(Hls.Events.FRAG_CHANGED, fragChanged)

      return () => {
        current.off(Hls.Events.FRAG_CHANGED, fragChanged)
      }
    }
  }, [focused, lowQualityFragments])

  return (
    <View style={[a.flex_1, a.rounded_sm, a.overflow_hidden]}>
      <div ref={containerRef} style={{height: '100%', width: '100%'}}>
        <figure style={{margin: 0, position: 'absolute', inset: 0}}>
          <video
            ref={videoRef}
            poster={embed.thumbnail}
            style={{width: '100%', height: '100%', objectFit: 'contain'}}
            playsInline
            preload="none"
            loop
            muted={!focused}
            aria-labelledby={embed.alt ? figId : undefined}
          />
          {embed.alt && (
            <figcaption
              id={figId}
              style={{
                position: 'absolute',
                width: 1,
                height: 1,
                padding: 0,
                margin: -1,
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                borderWidth: 0,
              }}>
              {embed.alt}
            </figcaption>
          )}
        </figure>
        <Controls
          videoRef={videoRef}
          hlsRef={hlsRef}
          active={active}
          setActive={setActive}
          focused={focused}
          setFocused={setFocused}
          onScreen={onScreen}
          fullscreenRef={containerRef}
          hasSubtitleTrack={hasSubtitleTrack}
        />
        <MediaInsetBorder />
      </div>
    </View>
  )
}

export class HLSUnsupportedError extends Error {
  constructor() {
    super('HLS is not supported')
  }
}

export class VideoNotFoundError extends Error {
  constructor() {
    super('Video not found')
  }
}
