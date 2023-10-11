// default implementation fallback for web

import React from 'react'
import {View} from 'react-native'
import {ImageSource} from '../../@types'

type Props = {
  imageSrc: ImageSource
  onRequestClose: () => void
  onZoom: (scaled: boolean) => void
  isScrollViewBeingDragged: boolean
}

const ImageItem = (_props: Props) => {
  return <View />
}

export default React.memo(ImageItem)
