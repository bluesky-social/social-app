import React from 'react'
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
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
  let aspectRatio
  switch (count) {
    case 2:
      aspectRatio = 2
      break
    case 3:
      aspectRatio = 2
      break
    case 4:
      aspectRatio = undefined
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
            <GalleryItem
              {...props}
              index={0}
              insetBorderStyle={noCorners(['topRight', 'bottomRight'])}
            />
          </View>
          <View style={[a.flex_1, {aspectRatio: 1}]}>
            <GalleryItem
              {...props}
              index={1}
              insetBorderStyle={noCorners(['topLeft', 'bottomLeft'])}
            />
          </View>
        </View>
      )

    case 3:
      return (
        <View style={[a.flex_1, a.flex_row, gap]}>
          <View style={[a.flex_1]}>
            <GalleryItem
              {...props}
              index={0}
              insetBorderStyle={noCorners(['topRight', 'bottomRight'])}
            />
          </View>
          <View style={[a.flex_1, gap]}>
            <View style={[a.flex_1]}>
              <GalleryItem
                {...props}
                index={1}
                insetBorderStyle={noCorners([
                  'topLeft',
                  'bottomLeft',
                  'bottomRight',
                ])}
              />
            </View>
            <View style={[a.flex_1]}>
              <GalleryItem
                {...props}
                index={2}
                insetBorderStyle={noCorners([
                  'topLeft',
                  'bottomLeft',
                  'topRight',
                ])}
              />
            </View>
          </View>
        </View>
      )

    case 4:
      return (
        <>
          <View style={[a.flex_row, gap]}>
            <View style={[a.flex_1, {aspectRatio: 1.5}]}>
              <GalleryItem
                {...props}
                index={0}
                insetBorderStyle={noCorners([
                  'bottomLeft',
                  'topRight',
                  'bottomRight',
                ])}
              />
            </View>
            <View style={[a.flex_1, {aspectRatio: 1.5}]}>
              <GalleryItem
                {...props}
                index={1}
                insetBorderStyle={noCorners([
                  'topLeft',
                  'bottomLeft',
                  'bottomRight',
                ])}
              />
            </View>
          </View>
          <View style={[a.flex_row, gap]}>
            <View style={[a.flex_1, {aspectRatio: 1.5}]}>
              <GalleryItem
                {...props}
                index={2}
                insetBorderStyle={noCorners([
                  'topLeft',
                  'topRight',
                  'bottomRight',
                ])}
              />
            </View>
            <View style={[a.flex_1, {aspectRatio: 1.5}]}>
              <GalleryItem
                {...props}
                index={3}
                insetBorderStyle={noCorners([
                  'topLeft',
                  'bottomLeft',
                  'topRight',
                ])}
              />
            </View>
          </View>
        </>
      )

    default:
      return null
  }
}

function noCorners(
  corners: ('topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight')[],
) {
  const styles: StyleProp<ViewStyle>[] = []
  if (corners.includes('topLeft')) {
    styles.push({borderTopLeftRadius: 0})
  }
  if (corners.includes('topRight')) {
    styles.push({borderTopRightRadius: 0})
  }
  if (corners.includes('bottomLeft')) {
    styles.push({borderBottomLeftRadius: 0})
  }
  if (corners.includes('bottomRight')) {
    styles.push({borderBottomRightRadius: 0})
  }
  return StyleSheet.flatten(styles)
}
