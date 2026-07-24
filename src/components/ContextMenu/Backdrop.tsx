import {Pressable} from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated'
import {useLingui} from '@lingui/react/macro'

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
  const {t: l} = useLingui()
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
        accessibilityLabel={l`Close menu`}
        accessibilityHint={l`Tap to close context menu`}
        onPress={onPress}
      />
    </Animated.View>
  )
}
