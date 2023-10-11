import React from 'react'
import {Platform, StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
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
  return (
    <View style={style}>
      <ImageLayoutGridInner {...props} />
    </View>
  )
}

interface ImageLayoutGridInnerProps {
  images: AppBskyEmbedImages.ViewImage[]
  onPress?: (index: number) => void
  onLongPress?: (index: number) => void
  onPressIn?: (index: number) => void
}

function ImageLayoutGridInner(props: ImageLayoutGridInnerProps) {
  const count = props.images.length

  switch (count) {
    case 2:
      return (
        <View style={styles.flexRow}>
          <View style={styles.smallItem}>
            <GalleryItem index={0} {...props} />
          </View>
          <View style={styles.smallItem}>
            <GalleryItem index={1} {...props} />
          </View>
        </View>
      )

    case 3:
      // Work around https://github.com/facebook/react-native/issues/40802
      const flexProp = Platform.OS === 'web' ? 'flex' : 'flexGrow'
      return (
        <View style={styles.flexRow}>
          <View style={{[flexProp]: 2, aspectRatio: 1}}>
            <GalleryItem index={0} {...props} />
          </View>
          <View style={{[flexProp]: 1, gap: 5}}>
            <View style={styles.smallItem}>
              <GalleryItem index={1} {...props} />
            </View>
            <View style={styles.smallItem}>
              <GalleryItem index={2} {...props} />
            </View>
          </View>
        </View>
      )

    case 4:
      return (
        <View style={styles.flexRow}>
          <View style={{flex: 1, gap: 5}}>
            <View style={styles.smallItem}>
              <GalleryItem index={0} {...props} />
            </View>
            <View style={styles.smallItem}>
              <GalleryItem index={2} {...props} />
            </View>
          </View>
          <View style={{flex: 1, gap: 5}}>
            <View style={styles.smallItem}>
              <GalleryItem index={1} {...props} />
            </View>
            <View style={styles.smallItem}>
              <GalleryItem index={3} {...props} />
            </View>
          </View>
        </View>
      )

    default:
      return null
  }
}

const styles = StyleSheet.create({
  flexRow: {flexDirection: 'row', gap: 5},
  smallItem: {flex: 1, aspectRatio: 1},
})
