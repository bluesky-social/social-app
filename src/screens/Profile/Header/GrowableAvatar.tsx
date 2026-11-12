import {type StyleProp, View, type ViewStyle} from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated'

import {usePagerHeaderContext} from '#/view/com/pager/PagerHeaderContext'
import {IS_IOS} from '#/env'

export function GrowableAvatar({
  children,
  style,
}: {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}) {
  const pagerContext = usePagerHeaderContext()

  // pagerContext should only be present on iOS, but better safe than sorry
  if (!pagerContext || !IS_IOS) {
    return <View style={style}>{children}</View>
  }

  const {scrollY} = pagerContext

  return (
    <GrowableAvatarInner scrollY={scrollY} style={style}>
      {children}
    </GrowableAvatarInner>
  )
}

function GrowableAvatarInner({
  scrollY,
  children,
  style,
}: {
  scrollY: SharedValue<number>
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}) {
  // Derived so the style only updates while overscrolling
  const scale = useDerivedValue(() =>
    interpolate(scrollY.get(), [-150, 0], [1.2, 1], {
      extrapolateRight: Extrapolation.CLAMP,
    }),
  )
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.get()}],
  }))

  return (
    <Animated.View
      style={[style, {transformOrigin: 'bottom left'}, animatedStyle]}>
      {children}
    </Animated.View>
  )
}
