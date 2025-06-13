import React from 'react'
import {type StyleProp, StyleSheet, View, type ViewStyle} from 'react-native'
import {type AnimatedRef, useAnimatedRef} from 'react-native-reanimated'
import {type AppBskyEmbedImages} from '@atproto/api'

import {atoms as a, useBreakpoints} from '#/alf'
import {PostEmbedViewContext} from '#/components/Post/Embed/types'
import {type Dimensions} from '../../lightbox/ImageViewing/@types'
import {GalleryItem} from './Gallery'

interface ImageLayoutGridProps {
  images: AppBskyEmbedImages.ViewImage[]
  onPress?: (
    index: number,
    containerRefs: AnimatedRef<any>[],
    fetchedDims: (Dimensions | null)[],
  ) => void
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

  return (
    <View style={style}>
      <View style={[gap, a.rounded_md, a.overflow_hidden]}>
        <ImageLayoutGridInner {...props} gap={gap} />
      </View>
    </View>
  )
}

interface ImageLayoutGridInnerProps {
  images: AppBskyEmbedImages.ViewImage[]
  onPress?: (
    index: number,
    containerRefs: AnimatedRef<any>[],
    fetchedDims: (Dimensions | null)[],
  ) => void
  onLongPress?: (index: number) => void
  onPressIn?: (index: number) => void
  viewContext?: PostEmbedViewContext
  gap: {gap: number}
}

function ImageLayoutGridInner(props: ImageLayoutGridInnerProps) {
  const gap = props.gap
  const count = props.images.length

  const containerRef1 = useAnimatedRef()
  const containerRef2 = useAnimatedRef()
  const containerRef3 = useAnimatedRef()
  const containerRef4 = useAnimatedRef()
  const thumbDimsRef = React.useRef<(Dimensions | null)[]>([])

  switch (count) {
    case 2: {
      const containerRefs = [containerRef1, containerRef2]
      return (
        <View style={[a.flex_1, a.flex_row, gap]}>
          <View style={[a.flex_1, {aspectRatio: 1}]}>
            <GalleryItem
              {...props}
              index={0}
              insetBorderStyle={noCorners(['topRight', 'bottomRight'])}
              containerRefs={containerRefs}
              thumbDimsRef={thumbDimsRef}
            />
          </View>
          <View style={[a.flex_1, {aspectRatio: 1}]}>
            <GalleryItem
              {...props}
              index={1}
              insetBorderStyle={noCorners(['topLeft', 'bottomLeft'])}
              containerRefs={containerRefs}
              thumbDimsRef={thumbDimsRef}
            />
          </View>
        </View>
      )
    }

    case 3: {
      const containerRefs = [containerRef1, containerRef2, containerRef3]
      return (
        <View style={[a.flex_1, a.flex_row, gap]}>
          <View style={[a.flex_1, {aspectRatio: 1}]}>
            <GalleryItem
              {...props}
              index={0}
              insetBorderStyle={noCorners(['topRight', 'bottomRight'])}
              containerRefs={containerRefs}
              thumbDimsRef={thumbDimsRef}
            />
          </View>
          <View style={[a.flex_1, {aspectRatio: 1}, gap]}>
            <View style={[a.flex_1]}>
              <GalleryItem
                {...props}
                index={1}
                insetBorderStyle={noCorners([
                  'topLeft',
                  'bottomLeft',
                  'bottomRight',
                ])}
                containerRefs={containerRefs}
                thumbDimsRef={thumbDimsRef}
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
                containerRefs={containerRefs}
                thumbDimsRef={thumbDimsRef}
              />
            </View>
          </View>
        </View>
      )
    }

    case 4: {
      const containerRefs = [
        containerRef1,
        containerRef2,
        containerRef3,
        containerRef4,
      ]
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
                containerRefs={containerRefs}
                thumbDimsRef={thumbDimsRef}
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
                containerRefs={containerRefs}
                thumbDimsRef={thumbDimsRef}
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
                containerRefs={containerRefs}
                thumbDimsRef={thumbDimsRef}
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
                containerRefs={containerRefs}
                thumbDimsRef={thumbDimsRef}
              />
            </View>
          </View>
        </>
      )
    }

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
