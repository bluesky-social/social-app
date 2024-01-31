import React from 'react'
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {AppBskyEmbedImages} from '@atproto/api'
import {GalleryItem} from './Gallery'
import {isWeb} from 'platform/detection'

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
      <View style={styles.container}>
        <ImageLayoutGridInner {...props} />
      </View>
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
            <GalleryItem {...props} index={0} imageStyle={styles.image} />
          </View>
          <View style={styles.smallItem}>
            <GalleryItem {...props} index={1} imageStyle={styles.image} />
          </View>
        </View>
      )

    case 3:
      return (
        <View style={styles.flexRow}>
          <View style={{flex: 2, aspectRatio: isWeb ? 1 : undefined}}>
            <GalleryItem {...props} index={0} imageStyle={styles.image} />
          </View>
          <View style={{flex: 1, gap: !isWeb ? 5 : undefined}}>
            <View style={styles.smallItem}>
              <GalleryItem {...props} index={1} imageStyle={styles.image} />
            </View>
            <View style={styles.smallItem}>
              <GalleryItem {...props} index={2} imageStyle={styles.image} />
            </View>
          </View>
        </View>
      )

    case 4:
      return (
        <>
          <View style={styles.flexRow}>
            <View style={styles.smallItem}>
              <GalleryItem {...props} index={0} imageStyle={styles.image} />
            </View>
            <View style={styles.smallItem}>
              <GalleryItem {...props} index={1} imageStyle={styles.image} />
            </View>
          </View>
          <View style={styles.flexRow}>
            <View style={styles.smallItem}>
              <GalleryItem {...props} index={2} imageStyle={styles.image} />
            </View>
            <View style={styles.smallItem}>
              <GalleryItem {...props} index={3} imageStyle={styles.image} />
            </View>
          </View>
        </>
      )

    default:
      return null
  }
}

// This is used to compute margins (rather than flexbox gap) due to Yoga bugs:
// https://github.com/facebook/yoga/issues/1418
const IMAGE_GAP = 5

const styles = StyleSheet.create({
  container: isWeb
    ? {
        marginHorizontal: -IMAGE_GAP / 2,
        marginVertical: -IMAGE_GAP / 2,
      }
    : {
        gap: IMAGE_GAP,
      },
  flexRow: {flexDirection: 'row', gap: !isWeb ? IMAGE_GAP : undefined},
  smallItem: {flex: 1, aspectRatio: 1},
  image: isWeb
    ? {
        margin: IMAGE_GAP / 2,
      }
    : {},
})
