import {useEffect, useId, useRef, useState} from 'react'
import {View} from 'react-native'
import {type AppBskyEmbedVideo} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import type * as HlsTypes from 'hls.js'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {atoms as a} from '#/alf'
import {MediaInsetBorder} from '#/components/MediaInsetBorder'
import * as BandwidthEstimate from './bandwidth-estimate'
import {Controls} from './web-controls/VideoControls'

export function VideoEmbedInnerWeb({
  embed,
  active,
  setActive,
  onScreen,
  lastKnownTime,
}: {
  embed: AppBskyEmbedVideo.View
  active: boolean
  setActive: () => void
  onScreen: boolean
  lastKnownTime: React.MutableRefObject<number | undefined>
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [focused, setFocused] = useState(false)
  const [hasSubtitleTrack, setHasSubtitleTrack] = useState(false)
  const [hlsLoading, setHlsLoading] = useState(false)
  const figId = useId()
  const {_} = useLingui()

  // send error up to error boundary
  const [error, setError] = useState<Error | null>(null)
  if (error) {
    throw error
  }

  const hlsRef = useHLS({
    playlist: embed.playlist,
    setHasSubtitleTrack,
    setError,
    videoRef,
    setHlsLoading,
  })

  useEffect(() => {
    if (lastKnownTime.current && videoRef.current) {
      videoRef.current.currentTime = lastKnownTime.current
    }
  }, [lastKnownTime])

  return (
    <View
      style={[a.flex_1, a.rounded_md, a.overflow_hidden]}
      accessibilityLabel={_(msg`Embedded video player`)}
      accessibilityHint="">
      <div ref={containerRef} style={{height: '100%', width: '100%'}}>
        <figure style={{margin: 0, position: 'absolute', inset: 0}}>
          <video
            ref={videoRef}
            poster={embed.thumbnail}
            style={{width: '100%', height: '100%', objectFit: 'contain'}}
            playsInline
            preload="none"
            muted={!focused}
            aria-labelledby={embed.alt ? figId : undefined}
            onTimeUpdate={e => {
              lastKnownTime.current = e.currentTarget.currentTime
            }}
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
          hlsLoading={hlsLoading}
          onScreen={onScreen}
          fullscreenRef={containerRef}
          hasSubtitleTrack={hasSubtitleTrack}
        />
      </div>
      <MediaInsetBorder />
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

type CachedPromise<T> = Promise<T> & {value: undefined | T}
const promiseForHls = import(
  // @ts-ignore
  'hls.js/dist/hls.min'
).then(mod => mod.default) as CachedPromise<typeof HlsTypes.default>
promiseForHls.value = undefined
promiseForHls.then(Hls => {
  promiseForHls.value = Hls
})

function useHLS({
  playlist,
  setHasSubtitleTrack,
  setError,
  videoRef,
  setHlsLoading,
}: {
  playlist: string
  setHasSubtitleTrack: (v: boolean) => void
  setError: (v: Error | null) => void
  videoRef: React.RefObject<HTMLVideoElement>
  setHlsLoading: (v: boolean) => void
}) {
  const [Hls, setHls] = useState<typeof HlsTypes.default | undefined>(
    () => promiseForHls.value,
  )
  useEffect(() => {
    if (!Hls) {
      setHlsLoading(true)
      promiseForHls.then(loadedHls => {
        setHls(() => loadedHls)
        setHlsLoading(false)
      })
    }
  }, [Hls, setHlsLoading])

  const hlsRef = useRef<HlsTypes.default | undefined>(undefined)
  const [lowQualityFragments, setLowQualityFragments] = useState<
    HlsTypes.Fragment[]
  >([])

  // purge low quality segments from buffer on next frag change
  const handleFragChange = useNonReactiveCallback(
    (
      _event: HlsTypes.Events.FRAG_CHANGED,
      {frag}: HlsTypes.FragChangedData,
    ) => {
      if (!Hls) return
      if (!hlsRef.current) return
      const hls = hlsRef.current

      // if the current quality level goes above 0, flush the low quality segments
      if (hls.nextAutoLevel > 0) {
        const flushed: HlsTypes.Fragment[] = []

        for (const lowQualFrag of lowQualityFragments) {
          // avoid if close to the current fragment
          if (Math.abs(frag.start - lowQualFrag.start) < 0.1) {
            continue
          }

          hls.trigger(Hls.Events.BUFFER_FLUSHING, {
            startOffset: lowQualFrag.start,
            endOffset: lowQualFrag.end,
            type: 'video',
          })

          flushed.push(lowQualFrag)
        }

        setLowQualityFragments(prev => prev.filter(f => !flushed.includes(f)))
      }
    },
  )

  const flushOnLoop = useNonReactiveCallback(() => {
    if (!Hls) return
    if (!hlsRef.current) return
    const hls = hlsRef.current
    // the above callback will catch most stale frags, but there's a corner case -
    // if there's only one segment in the video, it won't get flushed because it avoids
    // flushing the currently active segment. Therefore, we have to catch it when we loop
    if (
      hls.nextAutoLevel > 0 &&
      lowQualityFragments.length === 1 &&
      lowQualityFragments[0].start === 0
    ) {
      const lowQualFrag = lowQualityFragments[0]

      hls.trigger(Hls.Events.BUFFER_FLUSHING, {
        startOffset: lowQualFrag.start,
        endOffset: lowQualFrag.end,
        type: 'video',
      })
      setLowQualityFragments([])
    }
  })

  useEffect(() => {
    if (!videoRef.current) return
    if (!Hls) return
    if (!Hls.isSupported()) {
      throw new HLSUnsupportedError()
    }

    const hls = new Hls({
      maxMaxBufferLength: 10, // only load 10s ahead
      // note: the amount buffered is affected by both maxBufferLength and maxBufferSize
      // it will buffer until it is greater than *both* of those values
      // so we use maxMaxBufferLength to set the actual maximum amount of buffering instead
    })
    hlsRef.current = hls

    const latestEstimate = BandwidthEstimate.get()
    if (latestEstimate !== undefined) {
      hls.bandwidthEstimate = latestEstimate
    }

    hls.attachMedia(videoRef.current)
    hls.loadSource(playlist)

    // manually loop, so if we've flushed the first buffer it doesn't get confused
    const abortController = new AbortController()
    const {signal} = abortController
    const videoNode = videoRef.current
    videoNode.addEventListener(
      'ended',
      () => {
        flushOnLoop()
        videoNode.currentTime = 0
        videoNode.play()
      },
      {signal},
    )

    hls.on(Hls.Events.FRAG_LOADED, () => {
      BandwidthEstimate.set(hls.bandwidthEstimate)
    })

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

    hls.on(Hls.Events.FRAG_CHANGED, handleFragChange)

    return () => {
      hlsRef.current = undefined
      hls.detachMedia()
      hls.destroy()
      abortController.abort()
    }
  }, [
    playlist,
    setError,
    setHasSubtitleTrack,
    videoRef,
    handleFragChange,
    flushOnLoop,
    Hls,
  ])

  return hlsRef
}
