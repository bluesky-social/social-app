import React from 'react'
import {requireNativeViewManager} from 'expo-modules-core'

import {VideoPlayerViewProps} from './VideoPlayer.types'

const NativeView: React.ComponentType<VideoPlayerViewProps> =
  requireNativeViewManager('ExpoBlueskyVideoPlayer')

export default React.forwardRef<VideoPlayerViewProps>(
  // @ts-ignore TODO type these later
  function NativeVideoPlayer(props: VideoPlayerViewProps, ref) {
    // @ts-ignore
    return <NativeView {...props} ref={ref} />
  },
)
