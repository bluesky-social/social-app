import {type ComponentProps, type JSX} from 'react'
import {
  type Pressable,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
} from 'react-native'
import Animated from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {PressableScale} from '#/lib/custom-animations/PressableScale'
import {useHaptics} from '#/lib/haptics'
import {useMinimalShellFabTransform} from '#/lib/hooks/useMinimalShellTransform'
import {clamp} from '#/lib/numbers'
import {isWeb} from '#/platform/detection'
import {ios, useBreakpoints, useTheme} from '#/alf'
import {atoms as a} from '#/alf'

export interface FABProps extends ComponentProps<typeof Pressable> {
  testID?: string
  icon: JSX.Element
  style?: StyleProp<ViewStyle>
}

export function FABInner({testID, icon, onPress, style, ...props}: FABProps) {
  const insets = useSafeAreaInsets()
  const {gtMobile} = useBreakpoints()
  const t = useTheme()
  const playHaptic = useHaptics()
  const fabMinimalShellTransform = useMinimalShellFabTransform()

  const size = gtMobile ? styles.sizeLarge : styles.sizeRegular

  const tabletSpacing = gtMobile
    ? {right: 50, bottom: 50}
    : {right: 24, bottom: clamp(insets.bottom, 15, 60) + 15}

  return (
    <Animated.View
      style={[
        styles.outer,
        size,
        tabletSpacing,
        !gtMobile && fabMinimalShellTransform,
      ]}>
      <PressableScale
        testID={testID}
        onPressIn={ios(() => playHaptic('Light'))}
        onPress={evt => {
          onPress?.(evt)
          playHaptic('Light')
        }}
        onLongPress={ios((evt: any) => {
          onPress?.(evt)
          playHaptic('Heavy')
        })}
        targetScale={0.9}
        style={[
          a.rounded_full,
          size,
          {backgroundColor: t.palette.primary_500},
          a.align_center,
          a.justify_center,
          a.shadow_sm,
          style,
        ]}
        {...props}>
        {icon}
      </PressableScale>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  sizeRegular: {
    width: 56,
    height: 56,
    borderRadius: 30,
  },
  sizeLarge: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  outer: {
    // @ts-ignore web-only
    position: isWeb ? 'fixed' : 'absolute',
    zIndex: 1,
    cursor: 'pointer',
  },
})
