import {useCallback, useEffect, useRef, useState} from 'react'
import {ActivityIndicator, View} from 'react-native'
import {ImageBackground} from 'expo-image'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {getCurrentState, useOnAppStateChange} from '#/lib/appState'
import {
  createBoundPlaybackDurationTracker,
  getVideoMediaKey,
  sendVideoWatchSegment,
} from '#/lib/media/video/feedFeedback'
import {
  createPlaybackTelemetry,
  type PlaybackTelemetry,
} from '#/lib/media/video/playbackTelemetry'
import {ErrorBoundary} from '#/view/com/util/ErrorBoundary'
import {atoms as a, platform} from '#/alf'
import {Button} from '#/components/Button'
import {useThrottledValue} from '#/components/hooks/useThrottledValue'
import {ConstrainedImage} from '#/components/images/AutoSizedImage'
import {PlayButtonIcon} from '#/components/video/PlayButtonIcon'
import {useAnalytics} from '#/analytics'
import {IS_ANDROID} from '#/env'
import {useVideoWatchBinding} from '#/features/feedFeedback'
import {type app} from '#/lexicons'
import {GifPresentationControls} from './GifPresentationControls'
import {VideoEmbedInnerNative} from './VideoEmbedInner/VideoEmbedInnerNative'
import * as VideoFallback from './VideoEmbedInner/VideoFallback'

interface Props {
  embed: app.bsky.embed.video.View
  post?: app.bsky.feed.defs.PostView
}

export function VideoEmbed({embed, post}: Props) {
  const [key, setKey] = useState(0)

  const renderError = useCallback(
    (error: unknown) => (
      <VideoError error={error} retry={() => setKey(key + 1)} />
    ),
    [key],
  )

  let aspectRatio: number | undefined
  const dims = embed.aspectRatio
  if (dims) {
    aspectRatio = dims.width / dims.height
    if (Number.isNaN(aspectRatio)) {
      aspectRatio = undefined
    }
  }

  let constrained: number | undefined
  if (aspectRatio !== undefined) {
    const ratio = 1 / 2 // max of 1:2 ratio in feeds
    constrained = Math.max(aspectRatio, ratio)
  }

  const contents = (
    <ErrorBoundary renderError={renderError} key={key}>
      <InnerWrapper
        key={getVideoMediaKey({postUri: post?.uri, playlist: embed.playlist})}
        embed={embed}
        post={post}
      />
    </ErrorBoundary>
  )

  return (
    <View style={[a.pt_xs]}>
      <ConstrainedImage
        aspectRatio={constrained || 1}
        // slightly smaller max height than images
        // images use 16 / 9, for reference
        minMobileAspectRatio={14 / 9}>
        {contents}
      </ConstrainedImage>
    </View>
  )
}

function InnerWrapper({embed, post}: Props) {
  const {_} = useLingui()
  const ax = useAnalytics()
  const videoWatchBinding = useVideoWatchBinding()
  /** Unknown until the player reports it. */
  const videoDurationSeconds = useRef<number | undefined>(undefined)
  const ref = useRef<{togglePlayback: () => void}>(null)

  const [status, setStatus] = useState<'playing' | 'paused' | 'pending'>(
    'pending',
  )
  const [isLoading, setIsLoading] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const showSpinner = useThrottledValue(isActive && isLoading, 100)

  /*
   * Created lazily on first activation so videos that are never scrolled into
   * the active position cost nothing.
   */
  const telemetryRef = useRef<PlaybackTelemetry | null>(null)
  const impressionTrackedRef = useRef(false)
  const playbackStartTrackedRef = useRef(false)
  const [durationTracker] = useState(() => {
    const tracker = createBoundPlaybackDurationTracker({
      enabled: embed.presentation !== 'gif',
      binding: videoWatchBinding,
      // The player reports its real mode before playback starts.
      mode: {muted: true, fullscreen: false, autoplay: true},
      onSegment: (segment, binding, mode) => {
        ax.metric('video:playback:duration', {
          ...segment,
          postUri: post?.uri,
          postAuthorDid: post?.author.did,
          context: 'embed',
          presentation: embed.presentation === 'gif' ? 'gif' : 'video',
        })
        sendVideoWatchSegment({
          binding,
          segment,
          mode,
          context: 'embed',
          videoDurationSeconds: videoDurationSeconds.current,
        })
      },
    })
    tracker.setForeground(getCurrentState() === 'active')
    return tracker
  })
  const isAppActive = useRef(getCurrentState() === 'active')
  const isFullscreen = useRef(false)
  /*
   * Android plays fullscreen video in a separate Activity, which AppState
   * reports as the app going to the background. Keep counting while it's up.
   */
  const updateForeground = () => {
    durationTracker.setForeground(
      isAppActive.current || (IS_ANDROID && isFullscreen.current),
    )
  }
  useOnAppStateChange(state => {
    isAppActive.current = state === 'active'
    updateForeground()
  })
  useEffect(() => {
    durationTracker.rebind(videoWatchBinding)
  }, [durationTracker, videoWatchBinding])
  useEffect(() => {
    return () => {
      telemetryRef.current?.deactivated()
      durationTracker.flush('unmounted')
    }
  }, [durationTracker])

  const showOverlay =
    !isActive ||
    isLoading ||
    (status === 'paused' && !isActive) ||
    status === 'pending'

  if (!isActive && status !== 'pending') {
    setStatus('pending')
  }

  return (
    <>
      <VideoEmbedInnerNative
        embed={embed}
        setStatus={s => {
          setStatus(s)
          durationTracker.setPlaying(s === 'playing')
          if (s === 'playing') {
            telemetryRef.current?.playing()
          }
        }}
        setIsLoading={loading => {
          setIsLoading(loading)
          durationTracker.setBuffering(loading)
          if (!loading) {
            telemetryRef.current?.ready()
          }
        }}
        setIsActive={active => {
          setIsActive(active)
          durationTracker.setActive(active)
          if (active) {
            if (!impressionTrackedRef.current) {
              impressionTrackedRef.current = true
              ax.metric('video:impression', {
                postUri: post?.uri,
                postAuthorDid: post?.author.did,
                context: 'embed',
                presentation: embed.presentation === 'gif' ? 'gif' : 'video',
              })
            }
            if (telemetryRef.current == null) {
              telemetryRef.current = createPlaybackTelemetry({
                surface: 'feed',
                presentation: embed.presentation === 'gif' ? 'gif' : 'video',
              })
            }
            telemetryRef.current.activated()
          } else {
            telemetryRef.current?.deactivated()
          }
        }}
        onPlaybackStart={autoplay => {
          if (playbackStartTrackedRef.current) return
          playbackStartTrackedRef.current = true
          ax.metric('video:playback:start', {
            postUri: post?.uri,
            postAuthorDid: post?.author.did,
            context: 'embed',
            presentation: embed.presentation === 'gif' ? 'gif' : 'video',
            autoplay,
          })
        }}
        onPlaybackProgress={(progressSeconds, durationSeconds) => {
          if (durationSeconds !== undefined) {
            videoDurationSeconds.current = durationSeconds
          }
          durationTracker.observeProgress(progressSeconds)
        }}
        onPlaybackModeChange={mode => {
          durationTracker.setMode(mode)
          if (mode.fullscreen !== undefined) {
            isFullscreen.current = mode.fullscreen
            updateForeground()
          }
        }}
        onError={error => {
          durationTracker.flush('error')
          telemetryRef.current?.error(error)
          ax.metric('video:playback:failed', {
            surface: 'feed',
            presentation: embed.presentation === 'gif' ? 'gif' : 'video',
            errorClass: 'PlayerError',
            errorMessage: error.slice(0, 256),
            playlist: embed.playlist,
          })
        }}
        ref={ref}
      />
      <ImageBackground
        source={{uri: embed.thumbnail}}
        accessibilityIgnoresInvertColors
        style={[
          a.absolute,
          a.inset_0,
          {
            backgroundColor: 'transparent', // If you don't add `backgroundColor` to the styles here,
            // the play button won't show up on the first render on android 🥴😮‍💨
          },
          platform({
            android: {display: showOverlay ? 'flex' : 'none'},
            ios: {zIndex: showOverlay ? 1 : -1},
          }),
        ]}
        cachePolicy="memory-disk" // Preferring memory cache helps to avoid flicker when re-displaying on android
      >
        {showOverlay &&
          (embed.presentation === 'gif' ? (
            <GifPresentationControls
              isPlaying={false}
              isLoading={showSpinner}
              onPress={() => {
                ref.current?.togglePlayback()
              }}
              altText={embed.alt}
            />
          ) : (
            <Button
              style={[a.flex_1, a.align_center, a.justify_center]}
              onPress={() => {
                ref.current?.togglePlayback()
              }}
              label={_(msg`Play video`)}>
              {showSpinner ? (
                <View style={[a.align_center, a.justify_center]}>
                  <ActivityIndicator size="large" color="white" />
                </View>
              ) : (
                <PlayButtonIcon />
              )}
            </Button>
          ))}
      </ImageBackground>
    </>
  )
}

function VideoError({retry}: {error: unknown; retry: () => void}) {
  return (
    <VideoFallback.Container>
      <VideoFallback.Text>
        <Trans>
          An error occurred while loading the video. Please try again later.
        </Trans>
      </VideoFallback.Text>
      <VideoFallback.RetryButton onPress={retry} />
    </VideoFallback.Container>
  )
}
