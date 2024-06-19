import React, {ComponentProps, FC} from 'react'
import {Pressable, StyleSheet, Text, View} from 'react-native'
import {Image} from 'expo-image'
import {AppBskyEmbedImages} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isWeb} from '#/platform/detection'
import {useLargeAltBadgeEnabled} from '#/state/preferences/large-alt-badge'
import {atoms as a} from '#/alf'

type EventFunction = (index: number) => void

interface GalleryItemProps {
  images: AppBskyEmbedImages.ViewImage[]
  index: number
  onPress?: EventFunction
  onLongPress?: EventFunction
  onPressIn?: EventFunction
  imageStyle: ComponentProps<typeof Image>['style']
}

export const GalleryItem: FC<GalleryItemProps> = ({
  images,
  index,
  imageStyle,
  onPress,
  onPressIn,
  onLongPress,
}) => {
  const {_} = useLingui()
  const largeAltBadge = useLargeAltBadgeEnabled()
  const image = images[index]
  return (
    <View style={a.flex_1}>
      <Pressable
        onPress={onPress ? () => onPress(index) : undefined}
        onPressIn={onPressIn ? () => onPressIn(index) : undefined}
        onLongPress={onLongPress ? () => onLongPress(index) : undefined}
        style={a.flex_1}
        accessibilityRole="button"
        accessibilityLabel={image.alt || _(msg`Image`)}
        accessibilityHint="">
        <Image
          source={{uri: image.thumb}}
          style={[a.flex_1, a.rounded_xs, imageStyle]}
          accessible={true}
          accessibilityLabel={image.alt}
          accessibilityHint=""
          accessibilityIgnoresInvertColors
        />
      </Pressable>
      {image.alt === '' ? null : (
        <View style={styles.altContainer}>
          <Text
            style={[styles.alt, largeAltBadge && a.text_xs]}
            accessible={false}>
            ALT
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  altContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    position: 'absolute',
    // Related to margin/gap hack. This keeps the alt label in the same position
    // on all platforms
    right: isWeb ? 8 : 5,
    bottom: isWeb ? 8 : 5,
  },
  alt: {
    color: 'white',
    fontSize: 7,
    fontWeight: 'bold',
  },
})
