// default implementation fallback for web

import React from 'react'
import {View} from 'react-native'
import {AnimatedRef} from 'react-native-reanimated'

import {ImageSource} from '../../@types'

type Props = {
  imageSrc: ImageSource
  onRequestClose: () => void
  onTap: () => void
  onZoom: (scaled: boolean) => void
  isScrollViewBeingDragged: boolean
  showControls: boolean
  safeAreaRef: AnimatedRef<View>
}

const ImageItem = (_props: Props) => {
  return <View />
}

export default React.memo(ImageItem)
