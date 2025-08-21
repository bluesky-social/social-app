import {
  type LayoutChangeEvent,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native'
import Animated, {
  Easing,
  FadeInUp,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import {isIOS, isWeb} from '#/platform/detection'

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
    const targetHeight = isExpanded ? heightValue.get() : 0
    return {
      height: withTiming(targetHeight, {
        duration,
        easing: Easing.out(Easing.cubic),
      }),
      overflow: 'hidden',
    }
  })

  const onLayout = (e: LayoutChangeEvent) => {
    if (heightValue.get() === 0) {
      heightValue.set(e.nativeEvent.layout.height)
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
  duration = 200,
  style,
  children,
}: AccordionAnimationProps) {
  if (!isExpanded) return null

  return (
    <Animated.View
      style={style}
      entering={FadeInUp.duration(duration)}
      exiting={FadeOutUp.duration(duration / 2)}
      pointerEvents={isIOS ? 'auto' : 'box-none'}>
      {children}
    </Animated.View>
  )
}

export function AccordionAnimation(props: AccordionAnimationProps) {
  return isWeb ? <WebAccordion {...props} /> : <MobileAccordion {...props} />
}
