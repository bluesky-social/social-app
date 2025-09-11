// default implementation fallback for web

import React from 'react'
import {View} from 'react-native'
import {type PanGesture} from 'react-native-gesture-handler'
import {type SharedValue} from 'react-native-reanimated'

import {type Dimensions} from '#/lib/media/types'
import {
  type Dimensions as ImageDimensions,
  type ImageSource,
  type Transform,
} from '../../@types'

type Props = {
  imageSrc: ImageSource
  onRequestClose: () => void
  onTap: () => void
  onZoom: (scaled: boolean) => void
  onLoad: (dims: Dimensions) => void
  isScrollViewBeingDragged: boolean
  showControls: boolean
  measureSafeArea: () => {
    x: number
    y: number
    width: number
    height: number
  }
  imageAspect: number | undefined
  imageDimensions: ImageDimensions | undefined
  dismissSwipePan: PanGesture
  transforms: Readonly<
    SharedValue<{
      scaleAndMoveTransform: Transform
      cropFrameTransform: Transform
      cropContentTransform: Transform
      isResting: boolean
      isHidden: boolean
    }>
  >
}

const ImageItem = (_props: Props) => {
  return <View />
}

export default React.memo(ImageItem)
