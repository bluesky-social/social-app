import {useCallback, useEffect, useRef, useState} from 'react'
import {ActivityIndicator, View} from 'react-native'
import {ImageBackground} from 'expo-image'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

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
import {type app} from '#/lexicons'
import {GifPresentationControls} from './GifPresentationControls'
import {VideoEmbedInnerNative} from './VideoEmbedInner/VideoEmbedInnerNative'
import * as VideoFallback from './VideoEmbedInner/VideoFallback'

interface Props {
  embed: app.bsky.embed.video.View
}

export function VideoEmbed({embed}: Props) {
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
      <InnerWrapper embed={embed} />
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

function InnerWrapper({embed}: Props) {
  const {_} = useLingui()
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
  useEffect(() => {
    return () => {
      telemetryRef.current?.deactivated()
    }
  }, [])

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
          if (s === 'playing') {
            telemetryRef.current?.playing()
          }
        }}
        setIsLoading={loading => {
          setIsLoading(loading)
          if (!loading) {
            telemetryRef.current?.ready()
          }
        }}
        setIsActive={active => {
          setIsActive(active)
          if (active) {
            telemetryRef.current ??= createPlaybackTelemetry({
              surface: 'feed',
              presentation: embed.presentation === 'gif' ? 'gif' : 'video',
            })
            telemetryRef.current.activated()
          } else {
            telemetryRef.current?.deactivated()
          }
        }}
        onError={error => {
          telemetryRef.current?.error(error)
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
