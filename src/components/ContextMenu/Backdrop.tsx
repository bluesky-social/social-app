import {useEffect} from 'react'
import {Pressable} from 'react-native'
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {BlurView} from 'expo-blur'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a} from '#/alf'

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)

export function Backdrop({
  active,
  intensity = 50,
  onAnimationEnd,
  onPress,
}: {
  active: boolean
  intensity?: number
  onAnimationEnd?: () => void
  onPress?: () => void
}) {
  const {_} = useLingui()
  const intensitySV = useSharedValue(active ? intensity : 0)

  useEffect(() => {
    if (active) {
      intensitySV.set(withTiming(intensity, {duration: 500}))

      return () => {
        intensitySV.set(
          withTiming(0, {duration: 500}, finished => {
            if (finished) {
              onAnimationEnd?.()
            }
          }),
        )
      }
    }
  }, [intensitySV, active, intensity, onAnimationEnd])

  const animatedProps = useAnimatedProps(() => ({
    intensity: intensitySV.get(),
  }))

  return (
    <AnimatedBlurView
      animatedProps={animatedProps}
      style={[a.absolute, a.inset_0]}>
      <Pressable
        style={a.flex_1}
        accessibilityLabel={_(msg`Close menu`)}
        accessibilityHint={_(msg`Tap to close context menu`)}
        onPress={onPress}
      />
    </AnimatedBlurView>
  )
}
