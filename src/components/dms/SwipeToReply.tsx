import {useMemo} from 'react'
import {View} from 'react-native'
import {Gesture, type GestureType} from 'react-native-gesture-handler'
import Animated, {
  clamp,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

import {useHaptics} from '#/lib/haptics'
import {atoms as a, tokens, useTheme} from '#/alf'
import {ArrowCornerDownRight_Stroke2_Corner3_Rounded as ReplyIcon} from '#/components/icons/ArrowCornerDownRight'

// Distance the bubble must travel before releasing fires a reply.
const ACTIVATION_THRESHOLD = 56
// Past the activation point the bubble keeps moving but with exponentially
// increasing resistance, asymptotically approaching this much extra travel.
const MAX_OVERSHOOT = 32
const ICON_DIAMETER = 32
// Absurdly high value so the gesture doesn't arm on the vertical axis and
// hijack list scrolling. reanimated/RNGH don't offer clean per-axis disabling.
const EFFECTIVELY_DISABLED_OFFSET = 200

// 1:1 up to `threshold`, then exponentially diminishing travel: the marginal
// movement decays the further you pull, easing toward a soft cap of
// `threshold + MAX_OVERSHOOT` rather than hitting a hard wall.
function applyResistance(value: number) {
  'worklet'
  const abs = Math.abs(value)
  if (abs <= ACTIVATION_THRESHOLD) return value
  const sign = value < 0 ? -1 : 1
  const excess = abs - ACTIVATION_THRESHOLD
  return (
    sign *
    (ACTIVATION_THRESHOLD +
      MAX_OVERSHOOT * (1 - Math.exp(-excess / MAX_OVERSHOOT)))
  )
}

/**
 * Swipe a message bubble inward to reply, Signal/WhatsApp style. Self messages
 * (right-aligned) swipe left; others' messages (left-aligned) swipe right. A
 * reply icon sits stationary in the gutter on the bubble's resting edge and is
 * revealed (fade + scale) as the bubble slides away from it. Crossing the
 * activation threshold fires a haptic; releasing past it triggers `onReply`.
 *
 * The pan gesture is built here but handed to `children` via a render prop so
 * the consumer can compose it into the message's context-menu gestures with
 * `Gesture.Exclusive`. Sharing one arbitration group is what makes the swipe
 * and the long-press mutually exclusive - only one can ever win the touch.
 */
export function SwipeToReply({
  isFromSelf,
  onReply,
  enabled = true,
  children,
}: {
  isFromSelf: boolean
  onReply: () => void
  enabled?: boolean
  children: (swipeGesture: GestureType) => React.ReactNode
}) {
  const t = useTheme()
  const playHaptic = useHaptics()
  const isReducedMotion = useReducedMotion()

  const transX = useSharedValue(0)
  const hit = useSharedValue(false)
  const iconScale = useSharedValue(1)

  const swipeGesture = useMemo(() => {
    const runPop = () => {
      'worklet'
      if (isReducedMotion) return
      iconScale.set(() =>
        withSequence(
          withTiming(1.2, {duration: 175}),
          withTiming(1, {duration: 100}),
        ),
      )
    }

    return (
      Gesture.Pan()
        .enabled(enabled)
        // Arm only on the inward axis; the outward direction is effectively
        // disabled so the bubble can't be dragged off its own edge.
        .activeOffsetX(
          isFromSelf
            ? [-10, EFFECTIVELY_DISABLED_OFFSET]
            : [-EFFECTIVELY_DISABLED_OFFSET, 10],
        )
        .activeOffsetY([
          -EFFECTIVELY_DISABLED_OFFSET,
          EFFECTIVELY_DISABLED_OFFSET,
        ])
        .onChange(e => {
          'worklet'
          const dir = isFromSelf
            ? Math.min(e.translationX, 0)
            : Math.max(e.translationX, 0)
          transX.set(applyResistance(dir))

          const pastThreshold = Math.abs(transX.get()) >= ACTIVATION_THRESHOLD
          if (pastThreshold && !hit.get()) {
            hit.set(true)
            runPop()
            runOnJS(playHaptic)('Medium')
          } else if (!pastThreshold && hit.get()) {
            hit.set(false)
          }
        })
        .onEnd(() => {
          'worklet'
          // Only a clean end (finger lifted past threshold) triggers the reply.
          if (hit.get()) {
            runOnJS(onReply)()
          }
        })
        .onFinalize(() => {
          'worklet'
          // Runs on both end and cancellation, so the bubble always animates
          // home even if the gesture is interrupted mid-swipe.
          transX.set(withTiming(0, {duration: 200}))
          hit.set(false)
        })
    )
  }, [
    isFromSelf,
    enabled,
    onReply,
    playHaptic,
    isReducedMotion,
    transX,
    hit,
    iconScale,
  ])

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{translateX: transX.get()}],
  }))

  const iconStyle = useAnimatedStyle(() => {
    const progress = clamp(Math.abs(transX.get()) / ACTIVATION_THRESHOLD, 0, 1)
    return {
      opacity: progress,
      transform: [
        {scale: iconScale.get() * interpolate(progress, [0, 1], [0.5, 1])},
      ],
    }
  })

  return (
    <View style={[a.flex_1, a.relative]}>
      <Animated.View
        pointerEvents="none"
        style={[
          a.absolute,
          a.justify_center,
          {top: 0, bottom: 0},
          // Centred roughly half the activation threshold in from the bubble's
          // resting edge, so it lands in the gap the bubble reveals.
          isFromSelf ? {right: tokens.space.md} : {left: tokens.space.md},
          iconStyle,
        ]}>
        <View
          style={[
            a.justify_center,
            a.align_center,
            a.rounded_full,
            t.atoms.bg_contrast_50,
            {width: ICON_DIAMETER, height: ICON_DIAMETER},
          ]}>
          <ReplyIcon size="sm" style={t.atoms.text_contrast_medium} />
        </View>
      </Animated.View>
      {/* Sized + aligned to the bubble so the consumer's GestureDetector (the
          context menu's, which composes `swipeGesture`) covers only the bubble,
          leaving the gutter free for the back/scroll gestures. */}
      <Animated.View
        style={[
          {maxWidth: '80%'},
          isFromSelf ? a.self_end : a.self_start,
          contentStyle,
        ]}>
        {children(swipeGesture)}
      </Animated.View>
    </View>
  )
}
