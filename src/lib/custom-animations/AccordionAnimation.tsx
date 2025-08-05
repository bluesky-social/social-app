import {type StyleProp, View, type ViewStyle} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import {atoms as a} from '#/alf'

type AccordionAnimationProps = React.PropsWithChildren<{
  isExpanded: boolean
  duration?: number
  style?: StyleProp<ViewStyle>
}>

export function AccordionAnimation({
  isExpanded,
  duration = 300,
  style,
  children,
}: AccordionAnimationProps) {
  const height = useSharedValue(0)
  const derivedHeight = useDerivedValue(() => {
    const targetHeight = isExpanded ? height.value : 0
    return withTiming(targetHeight, {duration})
  }, [isExpanded, duration])

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
