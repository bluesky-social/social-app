import * as React from 'react'

import {ExpoBlueskyVideoPlayerViewProps} from './ExpoBlueskyVideoPlayer.types'

export default function ExpoBlueskyVideoPlayerView(
  props: ExpoBlueskyVideoPlayerViewProps,
) {
  return (
    <div>
      <span>{props.name}</span>
    </div>
  )
}
