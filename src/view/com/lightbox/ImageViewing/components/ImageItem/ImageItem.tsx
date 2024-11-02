// default implementation fallback for web

import React from 'react'
import {StyleProp, View} from 'react-native'
import {PanGesture} from 'react-native-gesture-handler'
import {ImageStyle} from 'expo-image'

import {ImageSource} from '../../@types'

type Props = {
  imageSrc: ImageSource
  onRequestClose: () => void
  onTap: () => void
  onZoom: (scaled: boolean) => void
  isScrollViewBeingDragged: boolean
  showControls: boolean
  dismissSwipePan: PanGesture | null
  animatedStyle: StyleProp<ImageStyle>
}

const ImageItem = (_props: Props) => {
  return <View />
}

export default React.memo(ImageItem)
