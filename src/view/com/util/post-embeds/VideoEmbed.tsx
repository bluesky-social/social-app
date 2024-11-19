import React, {useCallback, useState} from 'react'
import {ActivityIndicator, View} from 'react-native'
import {ImageBackground} from 'expo-image'
import {AppBskyEmbedVideo} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {clamp} from '#/lib/numbers'
import {VideoEmbedInnerNative} from '#/view/com/util/post-embeds/VideoEmbedInner/VideoEmbedInnerNative'
import {atoms as a} from '#/alf'
import {Button} from '#/components/Button'
import {useThrottledValue} from '#/components/hooks/useThrottledValue'
import {PlayButtonIcon} from '#/components/video/PlayButtonIcon'
import {ErrorBoundary} from '../ErrorBoundary'
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

  let aspectRatio = 16 / 9
  if (embed.aspectRatio) {
    const {width, height} = embed.aspectRatio
    aspectRatio = width / height
    aspectRatio = clamp(aspectRatio, 1 / 1, 3 / 1)
  }

  return (
    <View
      style={[
        a.w_full,
        a.rounded_md,
        a.overflow_hidden,
        {aspectRatio},
        {backgroundColor: 'black'},
        a.mt_xs,
      ]}>
      <ErrorBoundary renderError={renderError} key={key}>
        <InnerWrapper embed={embed} />
      </ErrorBoundary>
    </View>
  )
}

function InnerWrapper({embed}: Props) {
  const {_} = useLingui()
  const ref = React.useRef<{togglePlayback: () => void}>(null)

  const [status, setStatus] = React.useState<'playing' | 'paused' | 'pending'>(
    'pending',
  )
  const [isLoading, setIsLoading] = React.useState(false)
  const [isActive, setIsActive] = React.useState(false)
  const showSpinner = useThrottledValue(isActive && isLoading, 100)

  const showOverlay =
    !isActive ||
    isLoading ||
    (status === 'paused' && !isActive) ||
    status === 'pending'

  React.useEffect(() => {
    if (!isActive && status !== 'pending') {
      setStatus('pending')
    }
  }, [isActive, status])

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
            label={_(msg`Play video`)}
            color="secondary">
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
