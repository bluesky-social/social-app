import React from 'react'
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {AppBskyEmbedImages} from '@atproto/api'

import {isWeb} from 'platform/detection'
import {PostEmbedViewContext} from '#/view/com/util/post-embeds/types'
import {atoms as a} from '#/alf'
import {GalleryItem} from './Gallery'

interface ImageLayoutGridProps {
  images: AppBskyEmbedImages.ViewImage[]
  onPress?: (index: number) => void
  onLongPress?: (index: number) => void
  onPressIn?: (index: number) => void
  style?: StyleProp<ViewStyle>
  viewContext?: PostEmbedViewContext
}

export function ImageLayoutGrid({style, ...props}: ImageLayoutGridProps) {
  const gap =
    props.viewContext === PostEmbedViewContext.FeedEmbedRecordWithMedia
      ? a.gap_2xs
      : a.gap_xs
  return (
    <View style={style}>
      <View style={[styles.container, gap]}>
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
  viewContext?: PostEmbedViewContext
}

function ImageLayoutGridInner(props: ImageLayoutGridInnerProps) {
  const count = props.images.length
  const gap =
    props.viewContext === PostEmbedViewContext.FeedEmbedRecordWithMedia
      ? a.gap_2xs
      : a.gap_xs

  switch (count) {
    case 2:
      return (
        <View style={[a.flex_row, gap]}>
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
        <View style={[a.flex_row, gap]}>
          <View style={styles.threeSingle}>
            <GalleryItem {...props} index={0} imageStyle={styles.image} />
          </View>
          <View style={[styles.threeDouble, gap]}>
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
          <View style={[a.flex_row, gap]}>
            <View style={styles.smallItem}>
              <GalleryItem {...props} index={0} imageStyle={styles.image} />
            </View>
            <View style={styles.smallItem}>
              <GalleryItem {...props} index={1} imageStyle={styles.image} />
            </View>
          </View>
          <View style={[a.flex_row, gap]}>
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
    : {},
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
  },
})
