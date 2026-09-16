import Animated, {useAnimatedStyle} from 'react-native-reanimated'
import {LinearGradient} from 'expo-linear-gradient'

import {atoms as a, useTheme, utils} from '#/alf'
import {IS_LIQUID_GLASS} from '#/env'
import {useComposePromptState} from './context'

/**
 * Just tall enough to reach the bottom edge of the pill sitting above the bar.
 */
const GRADIENT_HEIGHT = 12

/**
 * Fade from the content into the bottom bar's background, drawn above the
 * bar so it moves and fades with it. Rendered inside the bar; only shown
 * while a compose pill is.
 */
export function ComposePromptGradient() {
  const {visibility, config} = useComposePromptState()
  const t = useTheme()

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: visibility.get(),
  }))

  // with Liquid Glass the pill shapes the list's scroll edge effect instead
  if (!config || IS_LIQUID_GLASS) {
    return null
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        a.absolute,
        a.left_0,
        a.right_0,
        {top: -GRADIENT_HEIGHT, height: GRADIENT_HEIGHT},
        fadeStyle,
      ]}>
      <LinearGradient
        key={t.name} // android does not update when you change the colors. sigh.
        start={[0.5, 0]}
        end={[0.5, 1]}
        colors={[
          utils.alpha(t.atoms.bg.backgroundColor, 0),
          t.atoms.bg.backgroundColor,
        ]}
        locations={[0, 1]}
        style={[a.flex_1]}
      />
    </Animated.View>
  )
}
