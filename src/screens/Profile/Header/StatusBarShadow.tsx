import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {LinearGradient} from 'expo-linear-gradient'

import {usePagerHeaderContext} from '#/view/com/pager/PagerHeaderContext'
import {atoms as a} from '#/alf'
import {IS_IOS} from '#/env'

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient)

export function StatusBarShadow() {
  const {top: topInset} = useSafeAreaInsets()
  const pagerContext = usePagerHeaderContext()

  if (IS_IOS && pagerContext) {
    const {scrollY} = pagerContext
    return <StatusBarShadowInnner scrollY={scrollY} />
  }

  return (
    <LinearGradient
      colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0)']}
      style={[
        a.absolute,
        a.z_10,
        {height: topInset, top: 0, left: 0, right: 0},
      ]}
    />
  )
}

function StatusBarShadowInnner({scrollY}: {scrollY: SharedValue<number>}) {
  const {top: topInset} = useSafeAreaInsets()

  // Derived so the style only updates while overscrolling
  const translateY = useDerivedValue(() => Math.min(0, scrollY.get()))
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{translateY: translateY.get()}],
  }))

  return (
    <AnimatedLinearGradient
      colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0)']}
      style={[
        animatedStyle,
        a.absolute,
        a.z_10,
        {height: topInset, top: 0, left: 0, right: 0},
      ]}
    />
  )
}
