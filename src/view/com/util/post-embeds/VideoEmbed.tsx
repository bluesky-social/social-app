import React, {useCallback, useEffect, useId, useState} from 'react'
import {View} from 'react-native'
import {ImageBackground} from 'expo-image'
import {PlayerError, VideoPlayerStatus} from 'expo-video'
import {AppBskyEmbedVideo} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {clamp} from '#/lib/numbers'
import {useAutoplayDisabled} from 'state/preferences'
import {VideoEmbedInnerNative} from '#/view/com/util/post-embeds/VideoEmbedInner/VideoEmbedInnerNative'
import {atoms as a} from '#/alf'
import {Button} from '#/components/Button'
import {Loader} from '#/components/Loader'
import {PlayButtonIcon} from '#/components/video/PlayButtonIcon'
import {VisibilityView} from '../../../../../modules/expo-bluesky-swiss-army'
import {ErrorBoundary} from '../ErrorBoundary'
import {useActiveVideoNative} from './ActiveVideoNativeContext'
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
  const {activeSource, activeViewId, setActiveSource, player} =
    useActiveVideoNative()
  const viewId = useId()

  const [playerStatus, setPlayerStatus] = useState<
    VideoPlayerStatus | 'paused'
  >('paused')
  const [isMuted, setIsMuted] = useState(player.muted)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [timeRemaining, setTimeRemaining] = React.useState(0)
  const disableAutoplay = useAutoplayDisabled()
  const isActive = embed.playlist === activeSource && activeViewId === viewId
  // There are some different loading states that we should pay attention to and show a spinner for
  const isLoading =
    isActive &&
    (playerStatus === 'waitingToPlayAtSpecifiedRate' ||
      playerStatus === 'loading')
  // This happens whenever the visibility view decides that another video should start playing
  const showOverlay = !isActive || isLoading || playerStatus === 'paused'

  // send error up to error boundary
  const [error, setError] = useState<Error | PlayerError | null>(null)
  if (error) {
    throw error
  }

  useEffect(() => {
    if (isActive) {
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const volumeSub = player.addListener('volumeChange', ({isMuted}) => {
        setIsMuted(isMuted)
      })
      const timeSub = player.addListener(
        'timeRemainingChange',
        secondsRemaining => {
          setTimeRemaining(secondsRemaining)
        },
      )
      const statusSub = player.addListener(
        'statusChange',
        (status, oldStatus, playerError) => {
          setPlayerStatus(status)
          if (status === 'error') {
            setError(playerError ?? new Error('Unknown player error'))
          }
          if (status === 'readyToPlay' && oldStatus !== 'readyToPlay') {
            player.play()
          }
        },
      )
      return () => {
        volumeSub.remove()
        timeSub.remove()
        statusSub.remove()
      }
    }
  }, [player, isActive, disableAutoplay])

  // The source might already be active (for example, if you are scrolling a list of quotes and its all the same
  // video). In those cases, just start playing. Otherwise, setting the active source will result in the video
  // start playback immediately
  const startPlaying = (ignoreAutoplayPreference: boolean) => {
    if (disableAutoplay && !ignoreAutoplayPreference) {
      return
    }

    if (isActive) {
      player.play()
    } else {
      setActiveSource(embed.playlist, viewId)
    }
  }

  const onVisibilityStatusChange = (isVisible: boolean) => {
    // When `isFullscreen` is true, it means we're actually still exiting the fullscreen player. Ignore these change
    // events
    if (isFullscreen) {
      return
    }
    if (isVisible) {
      startPlaying(false)
    } else {
      // Clear the active source so the video view unmounts when autoplay is disabled. Otherwise, leave it mounted
      // until it gets replaced by another video
      if (disableAutoplay) {
        setActiveSource(null, null)
      } else {
        player.muted = true
        if (player.playing) {
          player.pause()
        }
      }
    }
  }

  return (
    <VisibilityView enabled={true} onChangeStatus={onVisibilityStatusChange}>
      {isActive ? (
        <VideoEmbedInnerNative
          embed={embed}
          timeRemaining={timeRemaining}
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
          onPress={() => startPlaying(true)}
          label={_(msg`Play video`)}
          color="secondary">
          {isLoading ? (
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
    </VisibilityView>
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
