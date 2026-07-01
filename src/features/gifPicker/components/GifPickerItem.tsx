import {useState} from 'react'
import {Image} from 'expo-image'
import {useLingui} from '@lingui/react/macro'

import {useAutoplayDisabled} from '#/state/preferences'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useAnalytics} from '#/analytics'
import {IS_WEB} from '#/env'
import {type Gif} from '#/features/gifPicker/types'
import {gifPreviewUrl} from '#/features/gifPicker/utils'

export function GifPickerItem({
  gif,
  onSelectGif,
}: {
  gif: Gif
  onSelectGif: (gif: Gif) => void
}) {
  const ax = useAnalytics()
  const {t: l} = useLingui()
  const t = useTheme()
  const autoplayDisabled = useAutoplayDisabled()
  const [isPreviewing, setIsPreviewing] = useState(false)

  const [width, height] = gif.media_formats.tinygif.dims
  const aspectRatio = width > 0 && height > 0 ? width / height : 1

  const onPress = () => {
    ax.metric('composer:gif:select', {})
    onSelectGif(gif)
  }

  const shouldAnimate = !autoplayDisabled || isPreviewing
  const sourceUri = gifPreviewUrl(
    shouldAnimate
      ? gif.media_formats.tinygif.url
      : gif.media_formats.preview.url,
  )

  return (
    <Button
      label={l({
        message: `Select GIF "${gif.title}"`,
        comment:
          'Accessibility label for an individual GIF tile in the picker grid. The placeholder is the GIF’s title from the provider.',
      })}
      onPress={onPress}
      onHoverIn={() => setIsPreviewing(true)}
      onHoverOut={() => setIsPreviewing(false)}
      onLongPress={() => setIsPreviewing(true)}
      onPressOut={IS_WEB ? undefined : () => setIsPreviewing(false)}
      style={a.w_full}>
      {({pressed}) => (
        <Image
          style={[
            a.w_full,
            a.rounded_sm,
            t.atoms.bg_contrast_25,
            {
              aspectRatio,
              opacity: pressed ? 0.85 : 1,
              transform: [{scale: pressed ? 0.97 : 1}],
            },
          ]}
          source={{uri: sourceUri}}
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
