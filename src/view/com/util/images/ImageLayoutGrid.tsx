import React, {useMemo, useState} from 'react'
import {
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
import {Image, ImageStyle} from 'expo-image'
import {Dimensions} from 'lib/media/types'
import {AppBskyEmbedImages} from '@atproto/api'

export const DELAY_PRESS_IN = 500

interface ImageLayoutGridProps {
  images: AppBskyEmbedImages.ViewImage[]
  onPress?: (index: number) => void
  onLongPress?: (index: number) => void
  onPressIn?: (index: number) => void
  style?: StyleProp<ViewStyle>
}

export function ImageLayoutGrid({
  images,
  onPress,
  onLongPress,
  onPressIn,
  style,
}: ImageLayoutGridProps) {
  const [containerInfo, setContainerInfo] = useState<Dimensions | undefined>()

  const onLayout = (evt: LayoutChangeEvent) => {
    setContainerInfo({
      width: evt.nativeEvent.layout.width,
      height: evt.nativeEvent.layout.height,
    })
  }

  return (
    <View style={style} onLayout={onLayout}>
      {containerInfo ? (
        <ImageLayoutGridInner
          images={images}
          onPress={onPress}
          onPressIn={onPressIn}
          onLongPress={onLongPress}
          containerInfo={containerInfo}
        />
      ) : undefined}
    </View>
  )
}

interface ImageLayoutGridInnerProps {
  images: AppBskyEmbedImages.ViewImage[]
  onPress?: (index: number) => void
  onLongPress?: (index: number) => void
  onPressIn?: (index: number) => void
  containerInfo: Dimensions
}

function ImageLayoutGridInner({
  images,
  onPress,
  onLongPress,
  onPressIn,
  containerInfo,
}: ImageLayoutGridInnerProps) {
  const numImages = images.length
  const offset = numImages > 1 ? 5 : 0

  const size1 = useMemo<ImageStyle>(() => {
    const size =
      (containerInfo.width - offset * (numImages === 3 ? 2 : 1)) /
      (numImages === 3 ? 3 : 2)
    return {
      width: size,
      height: size,
      resizeMode: 'cover',
      borderRadius: 4,
    }
  }, [numImages, containerInfo, offset])

  const size2 = React.useMemo<ImageStyle>(() => {
    const size = (containerInfo.width * 2) / 3
    return {
      width: size - offset,
      height: size,
      resizeMode: 'cover',
      borderRadius: 4,
    }
  }, [containerInfo, offset])

  const direction = (
    numImages === 3
      ? {
          flexDirection: 'column',
          maxHeight: size2.height,
        }
      : {flexDirection: 'row'}
  ) as ViewStyle

  if (numImages > 0) {
    return (
      <View style={[styles.gallery, direction]}>
        {images.map(({alt, thumb}, index) => {
          const size = numImages === 3 && index === 0 ? size2 : size1

          return (
            <TouchableOpacity
              delayPressIn={DELAY_PRESS_IN}
              onPress={() => onPress?.(index)}
              onPressIn={() => onPressIn?.(index)}
              onLongPress={() => onLongPress?.(index)}>
              <Image
                source={{uri: thumb}}
                style={size}
                accessible={true}
                accessibilityLabel={alt}
              />
            </TouchableOpacity>
          )
        })}
      </View>
    )
  }

  return null
}

const styles = StyleSheet.create({
  gallery: {
    flexWrap: 'wrap',
    gap: 5,
  },
})
