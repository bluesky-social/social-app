import {type ComponentProps} from 'react'
import {
  type GestureResponderEvent,
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
import {atoms as a, ios, useBreakpoints, useTheme} from '#/alf'
import {IS_WEB} from '#/env'

export interface FABProps extends ComponentProps<typeof Pressable> {
  testID?: string
  icon: React.JSX.Element
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
    ? {right: a.pr_xl.paddingRight, bottom: a.pb_lg.paddingBottom}
    : {
        right: a.pr_lg.paddingRight,
        bottom:
          clamp(insets.bottom, a.pb_md.paddingBottom, 60) +
          a.pb_md.paddingBottom,
      }

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
        onLongPress={ios((evt: GestureResponderEvent) => {
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
    position: IS_WEB ? 'fixed' : 'absolute',
    zIndex: 1,
    cursor: 'pointer',
  },
})
