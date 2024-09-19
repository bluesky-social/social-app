import React from 'react'
import {StyleProp, View, ViewStyle} from 'react-native'
import {AppBskyEmbedImages} from '@atproto/api'

import {PostEmbedViewContext} from '#/view/com/util/post-embeds/types'
import {atoms as a, useBreakpoints} from '#/alf'
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
  const {gtMobile} = useBreakpoints()
  const gap =
    props.viewContext === PostEmbedViewContext.FeedEmbedRecordWithMedia
      ? gtMobile
        ? a.gap_xs
        : a.gap_2xs
      : a.gap_xs
  const count = props.images.length
  let aspectRatio = 1
  switch (count) {
    case 2:
      aspectRatio = 2
      break
    case 3:
      aspectRatio = 2
      break
    case 4:
      aspectRatio = 1.5
      break
  }
  return (
    <View style={style}>
      <View style={[gap, a.rounded_md, a.overflow_hidden, {aspectRatio}]}>
        <ImageLayoutGridInner {...props} gap={gap} />
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
  gap: {gap: number}
}

function ImageLayoutGridInner(props: ImageLayoutGridInnerProps) {
  const gap = props.gap
  const count = props.images.length

  switch (count) {
    case 2:
      return (
        <View style={[a.flex_1, a.flex_row, gap]}>
          <View style={[a.flex_1, {aspectRatio: 1}]}>
            <GalleryItem {...props} index={0} />
          </View>
          <View style={[a.flex_1, {aspectRatio: 1}]}>
            <GalleryItem {...props} index={1} />
          </View>
        </View>
      )

    case 3:
      return (
        <View style={[a.flex_1, a.flex_row, gap]}>
          <View style={[a.flex_1]}>
            <GalleryItem {...props} index={0} />
          </View>
          <View style={[a.flex_1, gap]}>
            <View style={[a.flex_1]}>
              <GalleryItem {...props} index={1} />
            </View>
            <View style={[a.flex_1]}>
              <GalleryItem {...props} index={2} />
            </View>
          </View>
        </View>
      )

    case 4:
      return (
        <>
          <View style={[a.flex_row, gap]}>
            <View style={[a.flex_1, {aspectRatio: 1.5}]}>
              <GalleryItem {...props} index={0} />
            </View>
            <View style={[a.flex_1, {aspectRatio: 1.5}]}>
              <GalleryItem {...props} index={1} />
            </View>
          </View>
          <View style={[a.flex_row, gap]}>
            <View style={[a.flex_1, {aspectRatio: 1.5}]}>
              <GalleryItem {...props} index={2} />
            </View>
            <View style={[a.flex_1, {aspectRatio: 1.5}]}>
              <GalleryItem {...props} index={3} />
            </View>
          </View>
        </>
      )

    default:
      return null
  }
}
