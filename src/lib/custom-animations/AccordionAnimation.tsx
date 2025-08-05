import {View} from 'react-native'
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import {atoms as a, type ViewStyleProp} from '#/alf'

interface AccordionAnimationProps {
  isExpanded: SharedValue<boolean>
  duration?: number
}

export function AccordionAnimation({
  isExpanded,
  duration = 300,
  children,
  style,
}: AccordionAnimationProps & React.PropsWithChildren & ViewStyleProp) {
  const height = useSharedValue(0)
  const derivedHeight = useDerivedValue(() =>
    withTiming(height.value * Number(isExpanded.value), {duration}),
  )

  const bodyStyle = useAnimatedStyle(() => ({
    height: derivedHeight.value,
  }))

  return (
    <Animated.View style={[a.overflow_hidden, bodyStyle, style]}>
      <View
        style={[a.absolute]}
        onLayout={e => (height.value = e.nativeEvent.layout.height)}>
        {children}
      </View>
    </Animated.View>
  )
}
