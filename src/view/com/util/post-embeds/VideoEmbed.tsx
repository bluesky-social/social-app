import React, {useCallback, useEffect, useId, useState} from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {PlayerError, VideoPlayerStatus} from 'expo-video'
import {AppBskyEmbedVideo} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {clamp} from '#/lib/numbers'
import {useGate} from '#/lib/statsig/statsig'
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
  const gate = useGate()

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

  if (!gate('video_view_on_posts')) {
    return null
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
    VideoPlayerStatus | 'switching'
  >('loading')
  const [isMuted, setIsMuted] = useState(player.muted)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [timeRemaining, setTimeRemaining] = React.useState(0)
  const isActive = embed.playlist === activeSource && activeViewId === viewId
  const isLoading =
    isActive &&
    (playerStatus === 'waitingToPlayAtSpecifiedRate' ||
      playerStatus === 'loading')
  const isSwitching = playerStatus === 'switching'
  const showOverlay = !isActive || isLoading || isSwitching

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
        (status, _oldStatus, playerError) => {
          setPlayerStatus(status)
          if (status === 'error') {
            setError(playerError ?? new Error('Unknown player error'))
          }
        },
      )
      return () => {
        volumeSub.remove()
        timeSub.remove()
        statusSub.remove()
      }
    }
  }, [player, isActive])

  useEffect(() => {
    if (!isActive && playerStatus !== 'loading') {
      setPlayerStatus('loading')
    }
  }, [isActive, playerStatus])

  const onChangeStatus = (isVisible: boolean) => {
    if (isFullscreen) {
      return
    }

    if (isVisible) {
      setActiveSource(embed.playlist, viewId)
      if (!player.playing) {
        player.play()
      }
    } else {
      setPlayerStatus('switching')
      player.muted = true
      if (player.playing) {
        player.pause()
      }
    }
  }

  return (
    <VisibilityView enabled={true} onChangeStatus={onChangeStatus}>
      {isActive ? (
        <VideoEmbedInnerNative
          embed={embed}
          timeRemaining={timeRemaining}
          isMuted={isMuted}
          isFullscreen={isFullscreen}
          setIsFullscreen={setIsFullscreen}
        />
      ) : null}
      <View
        style={[
          {
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            display: showOverlay ? 'flex' : 'none',
          },
        ]}>
        <Image
          source={{uri: embed.thumbnail}}
          alt={embed.alt}
          style={a.flex_1}
          contentFit="cover"
          accessibilityIgnoresInvertColors
        />
        <Button
          style={[a.absolute, a.inset_0]}
          onPress={() => {
            setActiveSource(embed.playlist, viewId)
          }}
          label={_(msg`Play video`)}
          color="secondary">
          {isLoading ? (
            <View
              style={[
                a.rounded_full,
                a.p_xs,
                a.absolute,
                {top: 'auto', left: 'auto'},
                {backgroundColor: 'rgba(0,0,0,0.5)'},
              ]}>
              <Loader size="2xl" style={{color: 'white'}} />
            </View>
          ) : (
            <PlayButtonIcon />
          )}
        </Button>
      </View>
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
