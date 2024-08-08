import React from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {AppBskyEmbedVideo} from '@atproto/api-prerelease'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {clamp} from '#/lib/numbers'
import {useGate} from '#/lib/statsig/statsig'
import {VideoEmbedInnerNative} from '#/view/com/util/post-embeds/VideoEmbedInner/VideoEmbedInnerNative'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {Play_Filled_Corner2_Rounded as PlayIcon} from '#/components/icons/Play'
import {VisibilityView} from '../../../../../modules/expo-bluesky-swiss-army'
import {useActiveVideoView} from './ActiveVideoContext'

export function VideoEmbed({embed}: {embed: AppBskyEmbedVideo.View}) {
  const t = useTheme()
  const {active, setActive} = useActiveVideoView({source: embed.playlist})
  const {_} = useLingui()
  const gate = useGate()

  if (!gate('videos')) {
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
        t.atoms.bg_contrast_25,
        {aspectRatio},
        a.my_xs,
      ]}>
      <VisibilityView
        enabled={true}
        onChangeStatus={isActive => {
          if (isActive) {
            setActive()
          }
        }}>
        {active ? (
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
              onPress={setActive}
              label={_(msg`Play video`)}
              variant="ghost"
              color="secondary"
              size="large">
              <PlayIcon width={48} fill={t.palette.white} />
            </Button>
          </>
        )}
      </VisibilityView>
    </View>
  )
}
