import React, {useMemo, useState} from 'react'
import {
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native'
import {ImageStyle} from 'expo-image'
import {Dimensions} from 'lib/media/types'
import {AppBskyEmbedImages} from '@atproto/api'
import {GalleryItem} from './Gallery'

interface ImageLayoutGridProps {
  images: AppBskyEmbedImages.ViewImage[]
  onPress?: (index: number) => void
  onLongPress?: (index: number) => void
  onPressIn?: (index: number) => void
  style?: StyleProp<ViewStyle>
}

export function ImageLayoutGrid({style, ...props}: ImageLayoutGridProps) {
  const [containerInfo, setContainerInfo] = useState<Dimensions | undefined>()

  const onLayout = (evt: LayoutChangeEvent) => {
    const {width, height} = evt.nativeEvent.layout
    setContainerInfo({
      width,
      height,
    })
  }

  return (
    <View style={style} onLayout={onLayout}>
      {containerInfo ? (
        <ImageLayoutGridInner {...props} containerInfo={containerInfo} />
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
  containerInfo,
  ...props
}: ImageLayoutGridInnerProps) {
  const count = props.images.length
  const size1 = useMemo<ImageStyle>(() => {
    if (count === 3) {
      const size = (containerInfo.width - 10) / 3
      return {width: size, height: size, resizeMode: 'cover', borderRadius: 4}
    } else {
      const size = (containerInfo.width - 5) / 2
      return {width: size, height: size, resizeMode: 'cover', borderRadius: 4}
    }
  }, [count, containerInfo])
  const size2 = React.useMemo<ImageStyle>(() => {
    if (count === 3) {
      const size = ((containerInfo.width - 10) / 3) * 2 + 5
      return {width: size, height: size, resizeMode: 'cover', borderRadius: 4}
    } else {
      const size = (containerInfo.width - 5) / 2
      return {width: size, height: size, resizeMode: 'cover', borderRadius: 4}
    }
  }, [count, containerInfo])

  switch (count) {
    case 2:
      return (
        <View style={styles.flexRow}>
          <GalleryItem index={0} {...props} imageStyle={size1} />
          <GalleryItem index={1} {...props} imageStyle={size1} />
        </View>
      )
    case 3:
      return (
        <View style={styles.flexRow}>
          <GalleryItem index={0} {...props} imageStyle={size2} />
          <View style={styles.flexColumn}>
            <GalleryItem index={1} {...props} imageStyle={size1} />
            <GalleryItem index={2} {...props} imageStyle={size1} />
          </View>
        </View>
      )
    case 4:
      return (
        <View style={styles.flexRow}>
          <View style={styles.flexColumn}>
            <GalleryItem index={0} {...props} imageStyle={size1} />
            <GalleryItem index={2} {...props} imageStyle={size1} />
          </View>
          <View style={styles.flexColumn}>
            <GalleryItem index={1} {...props} imageStyle={size1} />
            <GalleryItem index={3} {...props} imageStyle={size1} />
          </View>
        </View>
      )
    default:
      return null
  }
}

const styles = StyleSheet.create({
  flexRow: {flexDirection: 'row', gap: 5},
  flexColumn: {flexDirection: 'column', gap: 5},
})
