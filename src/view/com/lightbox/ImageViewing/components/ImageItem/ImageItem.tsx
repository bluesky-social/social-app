// default implementation fallback for web

import React, {MutableRefObject} from 'react'
import {View} from 'react-native'
import {GestureType} from 'react-native-gesture-handler'
import {ImageSource} from '../../@types'

type Props = {
  imageSrc: ImageSource
  onRequestClose: () => void
  onZoom: (scaled: boolean) => void
  pinchGestureRef: MutableRefObject<GestureType | undefined>
  isScrollViewBeingDragged: boolean
}

const ImageItem = (_props: Props) => {
  return <View />
}

export default React.memo(ImageItem)
