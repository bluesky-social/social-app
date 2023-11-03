import {AppBskyEmbedImages} from '@atproto/api'
import React, {ComponentProps, FC} from 'react'
import {StyleSheet, Text, Pressable, View} from 'react-native'
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
        accessibilityRole="button"
        onPress={onPress ? () => onPress(index) : undefined}
        onPressIn={onPressIn ? () => onPressIn(index) : undefined}
        onLongPress={onLongPress ? () => onLongPress(index) : undefined}
        style={styles.fullWidth}
        role="button"
        aria-label={image.alt || 'Image'}
        accessibilityHint="">
        <Image
          source={{uri: image.thumb}}
          style={[styles.image, imageStyle]}
          accessible={true}
          aria-label={image.alt}
          accessibilityHint=""
          accessibilityIgnoresInvertColors
        />
      </Pressable>
      {image.alt === '' ? null : (
        <View style={styles.altContainer}>
          <Text style={styles.alt} accessible={false}>
            ALT
          </Text>
        </View>
      )}
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
  altContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    position: 'absolute',
    left: 8,
    bottom: 8,
  },
  alt: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
})
