import {Pressable} from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
} from 'react-native-reanimated'
import {BlurView} from 'expo-blur'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {useContextMenuContext} from './context'

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)

type Props = {
  animation: SharedValue<number>
  intensity?: number
  onPress?: () => void
}

export function Backdrop(props: Props) {
  const {mode} = useContextMenuContext()
  switch (mode) {
    case 'full':
      return <BlurredBackdrop {...props} />
    case 'auxiliary-only':
      return <OpacityBackdrop {...props} />
  }
}

function BlurredBackdrop({animation, intensity = 50, onPress}: Props) {
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
      tint="systemMaterialDark">
      <Pressable
        style={a.flex_1}
        accessibilityLabel={_(msg`Close menu`)}
        accessibilityHint={_(msg`Tap to close context menu`)}
        onPress={onPress}
      />
    </AnimatedBlurView>
  )
}

function OpacityBackdrop({animation, onPress}: Props) {
  const t = useTheme()
  const {_} = useLingui()

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      animation.get(),
      [0, 1],
      [0, 0.05],
      Extrapolation.CLAMP,
    ),
  }))

  return (
    <Animated.View
      style={[a.absolute, a.inset_0, t.atoms.bg_contrast_975, animatedStyle]}>
      <Pressable
        style={a.flex_1}
        accessibilityLabel={_(msg`Close menu`)}
        accessibilityHint={_(msg`Tap to close context menu`)}
        onPress={onPress}
      />
    </Animated.View>
  )
}
