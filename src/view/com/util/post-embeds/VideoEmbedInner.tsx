import React, {useCallback} from 'react'
import {useWindowDimensions} from 'react-native'
import Animated, {
  measure,
  runOnJS,
  useAnimatedRef,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated'
import {VideoView} from 'expo-video'

import {atoms as a} from '#/alf'
import {useVideoPlayer} from './VideoPlayerContext'

export const VideoEmbedInner = ({}: {source: string}) => {
  const player = useVideoPlayer()
  const aref = useAnimatedRef<Animated.View>()
  const {height: windowHeight} = useWindowDimensions()
  const hasLeftView = useSharedValue(false)

  const onEnterView = useCallback(() => {
    if (player.status === 'readyToPlay') {
      player.play()
    }
  }, [player])

  const onLeaveView = useCallback(() => {
    player.pause()
  }, [player])

  useFrameCallback(() => {
    const measurement = measure(aref)

    if (measurement) {
      if (hasLeftView.value) {
        // Check if the video is in view
        if (
          measurement.pageY >= 0 &&
          measurement.pageY + measurement.height <= windowHeight
        ) {
          runOnJS(onEnterView)()
          hasLeftView.value = false
        }
      } else {
        // Check if the video is out of view
        if (
          measurement.pageY + measurement.height < 0 ||
          measurement.pageY > windowHeight
        ) {
          runOnJS(onLeaveView)()
          hasLeftView.value = true
        }
      }
    }
  })

  return (
    <Animated.View style={a.flex_1} ref={aref}>
      <VideoView player={player} style={a.flex_1} nativeControls />
    </Animated.View>
  )
}
