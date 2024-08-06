import React, {useCallback, useEffect, useRef, useState} from 'react'
import {Pressable, StyleSheet, useWindowDimensions, View} from 'react-native'
import Animated, {
  measure,
  runOnJS,
  useAnimatedRef,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated'
import {VideoPlayer, VideoView} from 'expo-video'
import {AppBskyEmbedVideo} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a} from '#/alf'
import {Text} from '#/components/Typography'
import {useVideoPlayer} from './VideoPlayerContext'

export function VideoEmbedInner({
  embed,
}: {
  embed: AppBskyEmbedVideo.View
  active: boolean
  setActive: () => void
  onScreen: boolean
}) {
  const {_} = useLingui()
  const player = useVideoPlayer()
  const aref = useAnimatedRef<Animated.View>()
  const {height: windowHeight} = useWindowDimensions()
  const hasLeftView = useSharedValue(false)
  const ref = useRef<VideoView>(null)

  const onEnterView = useCallback(() => {
    if (player.status === 'readyToPlay') {
      player.play()
    }
  }, [player])

  const onLeaveView = useCallback(() => {
    player.pause()
  }, [player])

  const enterFullscreen = useCallback(() => {
    if (ref.current) {
      ref.current.enterFullscreen()
    }
  }, [])

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

  let aspectRatio = 16 / 9

  if (embed.aspectRatio) {
    const {width, height} = embed.aspectRatio
    aspectRatio = width / height
    aspectRatio = clamp(aspectRatio, 1 / 1, 3 / 1)
  }

  return (
    <Animated.View
      style={[a.flex_1, a.relative, {aspectRatio}]}
      ref={aref}
      collapsable={false}>
      <VideoView
        ref={ref}
        player={player}
        style={a.flex_1}
        contentFit="contain"
        nativeControls={true}
        accessibilityIgnoresInvertColors
        accessibilityLabel={
          embed.alt ? _(msg`Video: ${embed.alt}`) : _(msg`Video`)
        }
        accessibilityHint=""
      />
      <VideoControls player={player} enterFullscreen={enterFullscreen} />
    </Animated.View>
  )
}

function VideoControls({
  player,
  enterFullscreen,
}: {
  player: VideoPlayer
  enterFullscreen: () => void
}) {
  const [currentTime, setCurrentTime] = useState(Math.floor(player.currentTime))

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(player.duration - player.currentTime))
      // how often should we update the time?
      // 1000 gets out of sync with the video time
    }, 250)

    return () => {
      clearInterval(interval)
    }
  }, [player])

  const minutes = Math.floor(currentTime / 60)
  const seconds = String(currentTime % 60).padStart(2, '0')

  if (isNaN(minutes)) {
    return null
  }

  return (
    <View style={[a.absolute, a.inset_0]}>
      <View style={styles.timeContainer} pointerEvents="none">
        <Text style={styles.timeElapsed}>
          {minutes}:{seconds}
        </Text>
      </View>
      <Pressable
        onPress={enterFullscreen}
        style={a.flex_1}
        accessibilityLabel="Video"
        accessibilityHint="Tap to enter full screen"
        accessibilityRole="button"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  timeContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    position: 'absolute',
    left: 5,
    bottom: 5,
  },
  timeElapsed: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
})

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
