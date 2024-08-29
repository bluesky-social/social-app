import React, {useCallback} from 'react'
import {Image} from 'expo-image'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logEvent} from '#/lib/statsig/statsig'
import {Gif} from '#/state/queries/tenor'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button} from '../Button'

export function GifPreview({
  gif,
  onSelectGif,
}: {
  gif: Gif
  onSelectGif: (gif: Gif) => void
}) {
  const {gtTablet} = useBreakpoints()
  const {_} = useLingui()
  const t = useTheme()

  const onPress = useCallback(() => {
    logEvent('composer:gif:select', {})
    onSelectGif(gif)
  }, [onSelectGif, gif])

  return (
    <Button
      label={_(msg`Select GIF "${gif.title}"`)}
      style={[a.flex_1, gtTablet ? {maxWidth: '33%'} : {maxWidth: '50%'}]}
      onPress={onPress}>
      {({pressed}) => (
        <Image
          style={[
            a.flex_1,
            a.mb_sm,
            a.rounded_sm,
            {aspectRatio: 1, opacity: pressed ? 0.8 : 1},
            t.atoms.bg_contrast_25,
          ]}
          source={{
            uri: gif.media_formats.tinygif.url,
          }}
          contentFit="cover"
          accessibilityLabel={gif.title}
          accessibilityHint=""
          cachePolicy="none"
          accessibilityIgnoresInvertColors
        />
      )}
    </Button>
  )
}
