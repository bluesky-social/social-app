import Animated, {
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {LinearGradient} from 'expo-linear-gradient'

import {isIOS} from '#/platform/detection'
import {usePagerHeaderContext} from '#/view/com/pager/PagerHeaderContext'
import {atoms as a} from '#/alf'

export function StatusBarShadow() {
  const {top: topInset} = useSafeAreaInsets()
  const pagerContext = usePagerHeaderContext()

  if (isIOS && pagerContext) {
    const {clampedScrollY} = pagerContext
    return <StatusBarShadowInnner clampedScrollY={clampedScrollY} />
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

function StatusBarShadowInnner({
  clampedScrollY,
}: {
  clampedScrollY: SharedValue<number>
}) {
  const {top: topInset} = useSafeAreaInsets()

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: Math.min(0, clampedScrollY.get()),
        },
      ],
    }
  })

  return (
    <Animated.View
      style={[
        a.absolute,
        a.top_0,
        a.left_0,
        a.right_0,
        a.z_10,
        {height: topInset},
        animatedStyle,
      ]}>
      <LinearGradient
        colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0)']}
        style={[a.flex_1]}
      />
    </Animated.View>
  )
}
