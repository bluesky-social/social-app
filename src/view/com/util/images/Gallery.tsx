import {AppBskyEmbedImages} from '@atproto/api'
import React, {ComponentProps, FC, useCallback} from 'react'
import {Pressable, StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import {Image} from 'expo-image'
import {useStores} from 'state/index'

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
  const store = useStores()

  const onPressAltText = useCallback(() => {
    store.shell.openModal({
      name: 'alt-text-image-read',
      altText: image.alt,
    })
  }, [image.alt, store.shell])

  return (
    <View>
      <TouchableOpacity
        delayPressIn={DELAY_PRESS_IN}
        onPress={() => onPress?.(index)}
        onPressIn={() => onPressIn?.(index)}
        onLongPress={() => onLongPress?.(index)}>
        <Image
          source={{uri: image.thumb}}
          style={imageStyle}
          accessible={true}
          accessibilityLabel={image.alt}
        />
      </TouchableOpacity>
      {image.alt === '' ? null : (
        <Pressable onPress={onPressAltText}>
          <Text style={styles.alt}>ALT</Text>
        </Pressable>
      )}
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
    left: 10,
    top: -26,
    width: 46,
  },
})
