import {Pressable} from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedProps,
} from 'react-native-reanimated'
import {BlurView} from 'expo-blur'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a} from '#/alf'

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)

export function Backdrop({
  animation,
  intensity = 50,
  onPress,
}: {
  animation: SharedValue<number>
  intensity?: number
  onPress?: () => void
}) {
  const {_} = useLingui()

  const animatedProps = useAnimatedProps(() => ({
    intensity: interpolate(
      animation.get(),
      [0, 1],
      [0, intensity],
      Extrapolation.CLAMP,
    ),
  }))

  return (
    <AnimatedBlurView
      animatedProps={animatedProps}
      style={[a.absolute, a.inset_0]}
      tint="systemThinMaterialDark">
      <Pressable
        style={a.flex_1}
        accessibilityLabel={_(msg`Close menu`)}
        accessibilityHint={_(msg`Tap to close context menu`)}
        onPress={onPress}
      />
    </AnimatedBlurView>
  )
}
