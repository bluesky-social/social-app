import {AppBskyEmbedImages} from '@atproto/api'
import React, {ComponentProps, FC} from 'react'
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import {Image} from 'expo-image'

type EventFunction = (index: number) => void

interface GalleryItemProps {
  images: AppBskyEmbedImages.ViewImage[]
  index: number
  onPress?: EventFunction
  onLongPress?: EventFunction
  onPressIn?: EventFunction
  imageStyle: ComponentProps<typeof Image>['style']
}

const DELAY_PRESS_IN = 500

export const GalleryItem: FC<GalleryItemProps> = ({
  images,
  index,
  imageStyle,
  onPress,
  onPressIn,
  onLongPress,
}) => {
  const image = images[index]

  return (
    <View>
      <TouchableOpacity
        delayPressIn={DELAY_PRESS_IN}
        onPress={onPress ? () => onPress(index) : undefined}
        onPressIn={onPressIn ? () => onPressIn(index) : undefined}
        onLongPress={onLongPress ? () => onLongPress(index) : undefined}
        accessibilityRole="button"
        accessibilityLabel="View image"
        accessibilityHint="">
        <Image
          source={{uri: image.thumb}}
          style={imageStyle}
          accessible={true}
          accessibilityLabel={image.alt}
          accessibilityHint=""
          accessibilityIgnoresInvertColors
        />
      </TouchableOpacity>
      {image.alt === '' ? null : <Text style={styles.alt}>ALT</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  alt: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 6,
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    position: 'absolute',
    left: 6,
    bottom: 6,
    width: 46,
  },
})
