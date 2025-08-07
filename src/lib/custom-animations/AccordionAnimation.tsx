import {type StyleProp, View, type ViewStyle} from 'react-native'
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import {isWeb} from '#/platform/detection'
import {atoms as a} from '#/alf'

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
  const height = useSharedValue(0)
  const derivedHeight = useDerivedValue(() => {
    const targetHeight = isExpanded ? height.value : 0
    return withTiming(targetHeight, {
      duration,
      easing: Easing.out(Easing.cubic),
    })
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
