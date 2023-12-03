import {AppBskyEmbedImages} from '@atproto/api'
import React, {ComponentProps, FC} from 'react'
import {StyleSheet, Pressable, View} from 'react-native'
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
    <View style={styles.fullWidth}>
      <Pressable
        onPress={onPress ? () => onPress(index) : undefined}
        onPressIn={onPressIn ? () => onPressIn(index) : undefined}
        onLongPress={onLongPress ? () => onLongPress(index) : undefined}
        style={styles.fullWidth}
        accessibilityRole="button"
        accessibilityLabel={image.alt || 'Image'}
        accessibilityHint="">
        <Image
          source={{uri: image.thumb}}
          style={[styles.image, imageStyle]}
          accessible={true}
          accessibilityLabel={image.alt}
          accessibilityHint=""
          accessibilityIgnoresInvertColors
        />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  fullWidth: {
    flex: 1,
  },
  image: {
    flex: 1,
    borderRadius: 4,
  },
})
