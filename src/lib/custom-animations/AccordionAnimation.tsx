import {
  type LayoutChangeEvent,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native'
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import {isWeb} from '#/platform/detection'

type AccordionAnimationProps = React.PropsWithChildren<{
  isExpanded: boolean
  duration?: number
  style?: StyleProp<ViewStyle>
}>

function WebAccordion({
  isExpanded,
  duration = 300,
  style,
  children,
}: AccordionAnimationProps) {
  const heightValue = useSharedValue(0)

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: withTiming(isExpanded ? heightValue.value : 0, {
        duration,
        easing: Easing.out(Easing.cubic),
      }),
      overflow: 'hidden',
    }
  })

  const onLayout = (e: LayoutChangeEvent) => {
    if (heightValue.value === 0) {
      heightValue.value = e.nativeEvent.layout.height
    }
  }

  return (
    <Animated.View style={[animatedStyle, style]}>
      <View onLayout={onLayout}>{children}</View>
    </Animated.View>
  )
}

function MobileAccordion({
  isExpanded,
  style,
  children,
}: AccordionAnimationProps) {
  if (!isExpanded) return null

  return (
    <Animated.View
      style={style}
      entering={FadeIn.duration(150)}
      exiting={FadeOut.duration(100)}>
      {children}
    </Animated.View>
  )
}

export function AccordionAnimation(props: AccordionAnimationProps) {
  return isWeb ? <WebAccordion {...props} /> : <MobileAccordion {...props} />
}
