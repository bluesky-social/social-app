import React, {useCallback, useId, useState} from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {AppBskyEmbedVideo} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {clamp} from '#/lib/numbers'
import {useGate} from '#/lib/statsig/statsig'
import {VideoEmbedInnerNative} from '#/view/com/util/post-embeds/VideoEmbedInner/VideoEmbedInnerNative'
import {atoms as a} from '#/alf'
import {Button} from '#/components/Button'
import {PlayButton} from '#/components/video/PlayButton'
import {VisibilityView} from '../../../../../modules/expo-bluesky-swiss-army'
import {ErrorBoundary} from '../ErrorBoundary'
import {useActiveVideoNative} from './ActiveVideoNativeContext'
import * as VideoFallback from './VideoEmbedInner/VideoFallback'

export function VideoEmbed({embed}: {embed: AppBskyEmbedVideo.View}) {
  const {_} = useLingui()
  const {activeSource, activeViewId, setActiveSource, player} =
    useActiveVideoNative()
  const viewId = useId()

  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const isActive = embed.playlist === activeSource && activeViewId === viewId

  const [key, setKey] = useState(0)
  const renderError = useCallback(
    (error: unknown) => (
      <VideoError error={error} retry={() => setKey(key + 1)} />
    ),
    [key],
  )
  const gate = useGate()

  const onChangeStatus = (isVisible: boolean) => {
    if (isVisible) {
      setActiveSource(embed.playlist, viewId)
      if (!player.playing) {
        player.play()
      }
    } else if (!isFullscreen) {
      player.muted = true
      if (player.playing) {
        player.pause()
      }
    }
  }

  if (!gate('video_view_on_posts')) {
    return null
  }

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
        <VisibilityView enabled={true} onChangeStatus={onChangeStatus}>
          {isActive ? (
            <VideoEmbedInnerNative
              embed={embed}
              isFullscreen={isFullscreen}
              setIsFullscreen={setIsFullscreen}
            />
          ) : (
            <>
              <Image
                source={{uri: embed.thumbnail}}
                alt={embed.alt}
                style={a.flex_1}
                contentFit="contain"
                accessibilityIgnoresInvertColors
              />
              <Button
                style={[a.absolute, a.inset_0]}
                onPress={() => {
                  setActiveSource(embed.playlist, viewId)
                }}
                label={_(msg`Play video`)}
                color="secondary">
                <PlayButton />
              </Button>
            </>
          )}
        </VisibilityView>
      </ErrorBoundary>
    </View>
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
