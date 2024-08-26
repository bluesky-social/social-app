import React, {useCallback, useState} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {VideoEmbedInnerNative} from 'view/com/util/post-embeds/VideoEmbedInner/VideoEmbedInnerNative'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {Play_Filled_Corner2_Rounded as PlayIcon} from '#/components/icons/Play'
import {VisibilityView} from '../../../../../modules/expo-bluesky-swiss-army'
import {ErrorBoundary} from '../ErrorBoundary'
import {useActiveVideoView} from './ActiveVideoContext'
import * as VideoFallback from './VideoEmbedInner/VideoFallback'

export function VideoEmbed({source}: {source: string}) {
  const t = useTheme()
  const {active, setActive} = useActiveVideoView({source})
  const {_} = useLingui()

  const [key, setKey] = useState(0)
  const renderError = useCallback(
    (error: unknown) => (
      <VideoError error={error} retry={() => setKey(key + 1)} />
    ),
    [key],
  )

  return (
    <View
      style={[
        a.w_full,
        a.rounded_sm,
        {aspectRatio: 16 / 9},
        a.overflow_hidden,
        t.atoms.bg_contrast_25,
        a.my_xs,
      ]}>
      <ErrorBoundary renderError={renderError} key={key}>
        <VisibilityView
          enabled={true}
          onChangeStatus={isActive => {
            if (isActive) {
              setActive()
            }
          }}>
          {active ? (
            <VideoEmbedInnerNative />
          ) : (
            <Button
              style={[a.flex_1, t.atoms.bg_contrast_25]}
              onPress={setActive}
              label={_(msg`Play video`)}
              variant="ghost"
              color="secondary"
              size="large">
              <ButtonIcon icon={PlayIcon} />
            </Button>
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
