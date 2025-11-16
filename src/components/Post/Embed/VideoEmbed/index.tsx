import {useCallback, useRef, useState} from 'react'
import {ActivityIndicator, View} from 'react-native'
import {ImageBackground} from 'expo-image'
import {type AppBskyEmbedVideo} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {ErrorBoundary} from '#/view/com/util/ErrorBoundary'
import {ConstrainedImage} from '#/view/com/util/images/AutoSizedImage'
import {atoms as a} from '#/alf'
import {Button} from '#/components/Button'
import {useThrottledValue} from '#/components/hooks/useThrottledValue'
import {PlayButtonIcon} from '#/components/video/PlayButtonIcon'
import {VideoEmbedInnerNative} from './VideoEmbedInner/VideoEmbedInnerNative'
import * as VideoFallback from './VideoEmbedInner/VideoFallback'

interface Props {
  embed: AppBskyEmbedVideo.View
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
        setStatus={setStatus}
        setIsLoading={setIsLoading}
        setIsActive={setIsActive}
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
            display: showOverlay ? 'flex' : 'none',
          },
        ]}
        cachePolicy="memory-disk" // Preferring memory cache helps to avoid flicker when re-displaying on android
      >
        {showOverlay && (
          <Button
            style={[a.flex_1, a.align_center, a.justify_center]}
            onPress={() => {
              ref.current?.togglePlayback()
            }}
            label={_(msg`Play video`)}>
            {showSpinner ? (
              <View
                style={[
                  a.rounded_full,
                  a.p_xs,
                  a.align_center,
                  a.justify_center,
                ]}>
                <ActivityIndicator size="large" color="white" />
              </View>
            ) : (
              <PlayButtonIcon />
            )}
          </Button>
        )}
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
