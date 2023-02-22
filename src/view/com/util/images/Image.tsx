import React from 'react'
import FastImage, {FastImageProps, Source} from 'react-native-fast-image'
export default FastImage
export type {OnLoadEvent, ImageStyle, Source} from 'react-native-fast-image'

export function HighPriorityImage({source, ...props}: FastImageProps) {
  const updatedSource = {
    uri: typeof source === 'object' && source ? source.uri : '',
    priority: FastImage.priority.high,
  } as Source
  return <FastImage source={updatedSource} {...props} />
}
