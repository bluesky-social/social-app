import React, {useCallback, useState} from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {AppBskyEmbedVideo} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {clamp} from '#/lib/numbers'
import {useGate} from '#/lib/statsig/statsig'
import {VideoEmbedInnerNative} from '#/view/com/util/post-embeds/VideoEmbedInner/VideoEmbedInnerNative'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {Play_Filled_Corner2_Rounded as PlayIcon} from '#/components/icons/Play'
import {VisibilityView} from '../../../../../modules/expo-bluesky-swiss-army'
import {ErrorBoundary} from '../ErrorBoundary'
import {useActiveVideoNative} from './ActiveVideoNativeContext'
import * as VideoFallback from './VideoEmbedInner/VideoFallback'

export function VideoEmbed({embed}: {embed: AppBskyEmbedVideo.View}) {
  const t = useTheme()
  const {activeSource, setActiveSource} = useActiveVideoNative()
  const isActive = embed.playlist === activeSource
  const {_} = useLingui()

  const [key, setKey] = useState(0)
  const renderError = useCallback(
    (error: unknown) => (
      <VideoError error={error} retry={() => setKey(key + 1)} />
    ),
    [key],
  )
  const gate = useGate()

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
        {backgroundColor: t.palette.black},
        a.my_xs,
      ]}>
      <ErrorBoundary renderError={renderError} key={key}>
        <VisibilityView
          enabled={true}
          onChangeStatus={isVisible => {
            if (isVisible) {
              setActiveSource(embed.playlist)
            }
          }}>
          {isActive ? (
            <VideoEmbedInnerNative embed={embed} />
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
                  setActiveSource(embed.playlist)
                }}
                label={_(msg`Play video`)}
                variant="ghost"
                color="secondary"
                size="large">
                <PlayIcon width={48} fill={t.palette.white} />
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
