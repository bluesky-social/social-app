import {Pressable} from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {useContextMenuContext} from './context'

export function Backdrop({
  animation,
  intensity = 50,
  onPress,
}: {
  animation: SharedValue<number>
  intensity?: number
  onPress?: () => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {mode} = useContextMenuContext()

  const reduced = mode === 'auxiliary-only'

  const target = reduced ? 0.05 : intensity / 100

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      animation.get(),
      [0, 1],
      [0, target],
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
