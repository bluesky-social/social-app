import React, {ComponentProps, FC} from 'react'
import {Pressable, View} from 'react-native'
import {Image} from 'expo-image'
import {AppBskyEmbedImages} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useLargeAltBadgeEnabled} from '#/state/preferences/large-alt-badge'
import {atoms as a, useTheme} from '#/alf'
import {Crop_Stroke2_Corner0_Rounded as Crop} from '#/components/icons/Crop'
import {Text} from '#/components/Typography'

type EventFunction = (index: number) => void

interface GalleryItemProps {
  images: AppBskyEmbedImages.ViewImage[]
  index: number
  onPress?: EventFunction
  onLongPress?: EventFunction
  onPressIn?: EventFunction
  imageStyle: ComponentProps<typeof Image>['style']
  hideBadges?: boolean
}

export const GalleryItem: FC<GalleryItemProps> = ({
  images,
  index,
  imageStyle,
  onPress,
  onPressIn,
  onLongPress,
  hideBadges,
}) => {
  const t = useTheme()
  const {_} = useLingui()
  const largeAltBadge = useLargeAltBadgeEnabled()
  const image = images[index]
  const hasAlt = !!image.alt
  const isCropped = React.useMemo(() => {
    if (!image.aspectRatio) return true
    const aspect = image.aspectRatio.width / image.aspectRatio.height
    return aspect !== 1
  }, [image.aspectRatio])
  return (
    <View style={a.flex_1}>
      <Pressable
        onPress={onPress ? () => onPress(index) : undefined}
        onPressIn={onPressIn ? () => onPressIn(index) : undefined}
        onLongPress={onLongPress ? () => onLongPress(index) : undefined}
        style={[
          a.flex_1,
          a.rounded_xs,
          a.overflow_hidden,
          t.atoms.bg_contrast_25,
          imageStyle,
        ]}
        accessibilityRole="button"
        accessibilityLabel={image.alt || _(msg`Image`)}
        accessibilityHint="">
        <Image
          source={{uri: image.thumb}}
          style={[a.flex_1]}
          accessible={true}
          accessibilityLabel={image.alt}
          accessibilityHint=""
          accessibilityIgnoresInvertColors
        />
      </Pressable>
      {(hasAlt || isCropped) && !hideBadges ? (
        <View
          accessible={false}
          style={[
            a.absolute,
            a.flex_row,
            a.align_center,
            a.rounded_xs,
            t.atoms.bg_contrast_25,
            {
              gap: 3,
              padding: 3,
              bottom: a.p_sm.padding,
              right: a.p_sm.padding,
              opacity: 0.8,
            },
            largeAltBadge && [
              {
                gap: 4,
                padding: 5,
              },
            ],
          ]}>
          {isCropped && (
            <Crop
              fill={t.atoms.text_contrast_high.color}
              width={largeAltBadge ? 18 : 12}
            />
          )}
          {hasAlt && (
            <Text
              style={[a.font_heavy, largeAltBadge ? a.text_xs : {fontSize: 8}]}>
              ALT
            </Text>
          )}
        </View>
      ) : null}
    </View>
  )
}
