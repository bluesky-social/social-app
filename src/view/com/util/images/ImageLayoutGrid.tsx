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
          <View style={styles.threeSingle}>
            <GalleryItem {...props} index={0} imageStyle={styles.image} />
          </View>
          <View style={styles.threeDouble}>
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

// On web we use margin to calculate gap, as aspectRatio does not properly size
// all images on web. On native though we cannot rely on margin, since the
// negative margin interferes with the swipe controls on pagers.
// https://github.com/facebook/yoga/issues/1418
// https://github.com/bluesky-social/social-app/issues/2601
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
  flexRow: {
    flexDirection: 'row',
    gap: isWeb ? undefined : IMAGE_GAP,
  },
  smallItem: {flex: 1, aspectRatio: 1},
  image: isWeb
    ? {
        margin: IMAGE_GAP / 2,
      }
    : {},
  threeSingle: {
    flex: 2,
    aspectRatio: isWeb ? 1 : undefined,
  },
  threeDouble: {
    flex: 1,
    gap: isWeb ? undefined : IMAGE_GAP,
  },
})
