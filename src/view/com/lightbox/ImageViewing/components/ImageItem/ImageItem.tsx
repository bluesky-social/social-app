// default implementation fallback for web

import React from 'react'
import {View} from 'react-native'

import {ImageSource} from '../../@types'

type Props = {
  imageSrc: ImageSource
  onRequestClose: () => void
  onTap: () => void
  onZoom: (scaled: boolean) => void
  isScrollViewBeingDragged: boolean
  showControls: boolean
}

const ImageItem = (_props: Props) => {
  return <View />
}

export default React.memo(ImageItem)
