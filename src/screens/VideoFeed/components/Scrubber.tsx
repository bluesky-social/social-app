import {useCallback, useMemo, useState} from 'react'
import {View} from 'react-native'
import {
  Gesture,
  GestureDetector,
  NativeGesture,
} from 'react-native-gesture-handler'
import Animated, {
  interpolate,
  runOnJS,
  runOnUI,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {
  useSafeAreaFrame,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'
import {useEventListener} from 'expo'
import {VideoPlayer} from 'expo-video'

import {formatTime} from '#/view/com/util/post-embeds/VideoEmbedInner/web-controls/utils'
import {tokens} from '#/alf'
import {atoms as a} from '#/alf'
import {Text} from '#/components/Typography'

// magic number that is roughly the min height of the write reply button
// we inset the video by this amount
export const VIDEO_PLAYER_BOTTOM_INSET = 57

export function Scrubber({
  active,
  player,
  seekingAnimationSV,
  scrollGesture,
  children,
}: {
  active: boolean
  player?: VideoPlayer
  seekingAnimationSV: SharedValue<number>
  scrollGesture: NativeGesture
  children?: React.ReactNode
}) {
  const {width: screenWidth} = useSafeAreaFrame()
  const insets = useSafeAreaInsets()
  const currentTimeSV = useSharedValue(0)
  const durationSV = useSharedValue(0)
  const [currentSeekTime, setCurrentSeekTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const updateTime = (currentTime: number, duration: number) => {
    'worklet'
    currentTimeSV.set(currentTime)
    if (duration !== 0) {
      durationSV.set(duration)
    }
  }

  const isSeekingSV = useSharedValue(false)
  const seekProgressSV = useSharedValue(0)

  useAnimatedReaction(
    () => Math.round(seekProgressSV.get()),
    (progress, prevProgress) => {
      if (progress !== prevProgress) {
        runOnJS(setCurrentSeekTime)(progress)
      }
    },
  )

  const seekBy = useCallback(
    (time: number) => {
      player?.seekBy(time)

      setTimeout(() => {
        runOnUI(() => {
          'worklet'
          isSeekingSV.set(false)
          seekingAnimationSV.set(withTiming(0, {duration: 500}))
        })()
      }, 50)
    },
    [player, isSeekingSV, seekingAnimationSV],
  )

  const scrubPanGesture = useMemo(() => {
    return Gesture.Pan()
      .blocksExternalGesture(scrollGesture)
      .activeOffsetX([-10, 10])
      .failOffsetY([-10, 10])
      .onStart(() => {
        'worklet'
        seekProgressSV.set(currentTimeSV.get())
        isSeekingSV.set(true)
        seekingAnimationSV.set(withTiming(1, {duration: 500}))
      })
      .onUpdate(evt => {
        'worklet'
        const progress = evt.x / screenWidth
        seekProgressSV.set(
          clamp(progress * durationSV.get(), 0, durationSV.get()),
        )
      })
      .onEnd(evt => {
        'worklet'
        isSeekingSV.get()

        const progress = evt.x / screenWidth
        const newTime = clamp(progress * durationSV.get(), 0, durationSV.get())

        // optimisically set the progress bar
        seekProgressSV.set(newTime)

        // it's seek by, so offset by the current time
        // seekBy sets isSeekingSV back to false, so no need to do that here
        runOnJS(seekBy)(newTime - currentTimeSV.get())
      })
  }, [
    scrollGesture,
    seekingAnimationSV,
    seekBy,
    screenWidth,
    currentTimeSV,
    durationSV,
    isSeekingSV,
    seekProgressSV,
  ])

  const timeStyle = useAnimatedStyle(() => {
    return {
      display: seekingAnimationSV.get() === 0 ? 'none' : 'flex',
      opacity: seekingAnimationSV.get(),
    }
  })

  const barStyle = useAnimatedStyle(() => {
    const currentTime = isSeekingSV.get()
      ? seekProgressSV.get()
      : currentTimeSV.get()
    const progress = currentTime === 0 ? 0 : currentTime / durationSV.get()
    const isSeeking = seekingAnimationSV.get()
    return {
      height: isSeeking * 3 + 1,
      opacity: interpolate(isSeeking, [0, 1], [0.4, 0.6]),
      width: `${progress * 100}%`,
    }
  })
  const trackStyle = useAnimatedStyle(() => {
    return {
      height: seekingAnimationSV.get() * 3 + 1,
    }
  })
  const childrenStyle = useAnimatedStyle(() => {
    return {
      opacity: 1 - seekingAnimationSV.get(),
    }
  })

  return (
    <>
      {player && active && (
        <PlayerListener
          player={player}
          setDuration={setDuration}
          updateTime={updateTime}
        />
      )}
      <Animated.View
        style={[
          a.absolute,
          {
            left: 0,
            right: 0,
            bottom: insets.bottom + 80,
          },
          timeStyle,
        ]}
        pointerEvents="none">
        <Text style={[a.text_center, a.font_bold]}>
          <Text style={[a.text_5xl, {fontVariant: ['tabular-nums']}]}>
            {formatTime(currentSeekTime)}
          </Text>
          <Text style={[a.text_2xl, {opacity: 0.8}]}>{'  /  '}</Text>
          <Text
            style={[
              a.text_5xl,
              {opacity: 0.8},
              {fontVariant: ['tabular-nums']},
            ]}>
            {formatTime(duration)}
          </Text>
        </Text>
      </Animated.View>

      <GestureDetector gesture={scrubPanGesture}>
        <View
          style={[
            a.relative,
            a.w_full,
            a.justify_end,
            {
              paddingBottom: insets.bottom,
              minHeight:
                // bottom padding
                insets.bottom +
                // scrubber height
                tokens.space.lg +
                // write reply height
                VIDEO_PLAYER_BOTTOM_INSET,
            },
            a.z_10,
          ]}>
          <View style={[a.w_full, a.relative]}>
            <Animated.View
              style={[
                a.w_full,
                {backgroundColor: 'white', opacity: 0.2},
                trackStyle,
              ]}
            />
            <Animated.View
              style={[
                a.absolute,
                {top: 0, left: 0, backgroundColor: 'white'},
                barStyle,
              ]}
            />
          </View>
          <Animated.View
            style={[{minHeight: VIDEO_PLAYER_BOTTOM_INSET}, childrenStyle]}>
            {children}
          </Animated.View>
        </View>
      </GestureDetector>
    </>
  )
}

function PlayerListener({
  player,
  setDuration,
  updateTime,
}: {
  player: VideoPlayer
  setDuration: (duration: number) => void
  updateTime: (currentTime: number, duration: number) => void
}) {
  useEventListener(player, 'timeUpdate', evt => {
    const duration = player.duration
    if (duration !== 0) {
      setDuration(Math.round(duration))
    }
    runOnUI(updateTime)(evt.currentTime, duration)
  })

  return null
}

function clamp(num: number, min: number, max: number) {
  'worklet'
  return Math.min(Math.max(num, min), max)
}
