import React, {useCallback, useState} from 'react'
import {View} from 'react-native'
import {ImageBackground} from 'expo-image'
import {AppBskyEmbedVideo} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {clamp} from '#/lib/numbers'
import {useAutoplayDisabled} from 'state/preferences'
import {VideoEmbedInnerNative} from '#/view/com/util/post-embeds/VideoEmbedInner/VideoEmbedInnerNative'
import {atoms as a} from '#/alf'
import {Button} from '#/components/Button'
import {useIsWithinMessage} from '#/components/dms/MessageContext'
import {Loader} from '#/components/Loader'
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
        a.rounded_sm,
        a.overflow_hidden,
        {aspectRatio},
        {backgroundColor: 'black'},
        a.my_xs,
      ]}>
      <ErrorBoundary renderError={renderError} key={key}>
        <InnerWrapper embed={embed} />
      </ErrorBoundary>
    </View>
  )
}

function InnerWrapper({embed}: Props) {
  const {_} = useLingui()

  // TODO
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const isWithinMessage = useIsWithinMessage()
  const disableAutoplay = useAutoplayDisabled() || isWithinMessage
  // There are some different loading states that we should pay attention to and show a spinner for

  // This happens whenever the visibility view decides that another video should start playing
  const showOverlay = false

  // send error up to error boundary
  // const [error, setError] = useState<Error | PlayerError | null>(null)
  // if (error) {
  //   throw error
  // }

  return (
    <>
      {true ? (
        <VideoEmbedInnerNative
          embed={embed}
          isMuted={isMuted}
          isFullscreen={isFullscreen}
          setIsFullscreen={setIsFullscreen}
        />
      ) : null}
      <ImageBackground
        source={{uri: embed.thumbnail}}
        accessibilityIgnoresInvertColors
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'transparent', // If you don't add `backgroundColor` to the styles here,
            // the play button won't show up on the first render on android 🥴😮‍💨
            display: showOverlay ? 'flex' : 'none',
          },
        ]}
        cachePolicy="memory-disk" // Preferring memory cache helps to avoid flicker when re-displaying on android
      >
        <Button
          style={[a.flex_1, a.align_center, a.justify_center]}
          onPress={() => {}}
          label={_(msg`Play video`)}
          color="secondary">
          {false ? ( // isLoading
            <View
              style={[
                a.rounded_full,
                a.p_xs,
                a.align_center,
                a.justify_center,
                {backgroundColor: 'rgba(0,0,0,0.5)'},
              ]}>
              <Loader size="2xl" style={{color: 'white'}} />
            </View>
          ) : (
            <PlayButtonIcon />
          )}
        </Button>
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
