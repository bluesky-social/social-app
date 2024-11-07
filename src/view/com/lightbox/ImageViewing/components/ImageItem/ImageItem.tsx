// default implementation fallback for web

import React from 'react'
import {ImageStyle, StyleProp, View} from 'react-native'
import {PanGesture} from 'react-native-gesture-handler'
import {BaseAnimationBuilder} from 'react-native-reanimated'

import {Dimensions as ImageDimensions, ImageSource} from '../../@types'

type Props = {
  imageSrc: ImageSource
  onRequestClose: () => void
  onTap: () => void
  onZoom: (scaled: boolean) => void
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
  imageStyle: StyleProp<ImageStyle>
  dismissSwipePan: PanGesture
  layoutAnimationAndroid: BaseAnimationBuilder
}

const ImageItem = (_props: Props) => {
  return <View />
}

export default React.memo(ImageItem)
