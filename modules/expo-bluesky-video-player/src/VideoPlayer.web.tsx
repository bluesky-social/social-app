import * as React from 'react'
import {Pressable} from 'react-native'

import {VideoPlayerViewProps} from './VideoPlayer.types'

export function VideoPlayer({source, autoplay, style}: VideoPlayerViewProps) {
  const videoPlayerRef = React.useRef<HTMLMediaElement>(null)

  const onPress = React.useCallback(() => {
    if (videoPlayerRef.current?.paused) {
      videoPlayerRef.current?.play()
    } else {
      videoPlayerRef.current?.pause()
    }
  }, [])

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <video
        src={source}
        autoPlay={autoplay ? 'autoplay' : undefined}
        style={style}
        preload={autoplay ? 'auto' : undefined}
        loop="loop"
        muted="muted"
        ref={videoPlayerRef}
      />
    </Pressable>
  )
}
