import * as React from 'react'

import {VideoPlayerViewProps} from './VideoPlayer.types'

export function VideoPlayer({source, autoplay, style}: VideoPlayerViewProps) {
  return <video src={source} autoPlay={autoplay} style={style} />
}
