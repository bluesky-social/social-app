import {useState} from 'react'
import {View} from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {scheduleOnRN} from 'react-native-worklets'

import {atoms as a} from '#/alf'

const DURATION = 200

/**
 * Content revealed beneath a row's header, e.g. an expanded list of actors.
 * It grows from nothing to the height of `children` when `expanded`, and
 * shrinks away again when not, unmounting once it's closed. Rows below it in
 * the list move with it, and if `children` change height while open, e.g.
 * after "Show more", that animates too. With reduced motion it just shows or
 * hides.
 */
export function Expandable({
  expanded,
  children,
}: {
  expanded: boolean
  children: React.ReactNode
}) {
  const reducedMotion = useReducedMotion()
  // Stays mounted after collapsing starts, until it's finished
  const [isMounted, setIsMounted] = useState(expanded)
  if (expanded && !isMounted) {
    setIsMounted(true)
  }

  if (reducedMotion) {
    return expanded ? children : null
  }
  if (!isMounted) {
    return null
  }
  return (
    <AnimatedHeight expanded={expanded} onCollapsed={() => setIsMounted(false)}>
      {children}
    </AnimatedHeight>
  )
}

/*
 * The height is measured and animated, rather than using a layout transition,
 * because it works the same in a virtualized list on every platform. The list
 * lays its cells out in a column, so growing this one moves the cells below
 * it a frame at a time, whereas a layout transition would only animate this
 * cell's own children. It's driven from the UI thread on native.
 */
function AnimatedHeight({
  expanded,
  onCollapsed,
  children,
}: {
  expanded: boolean
  onCollapsed: () => void
  children: React.ReactNode
}) {
  const contentHeight = useSharedValue(0)

  const style = useAnimatedStyle(() => ({
    height: withTiming(
      expanded ? contentHeight.get() : 0,
      {duration: DURATION, easing: Easing.out(Easing.cubic)},
      finished => {
        if (finished && !expanded) {
          scheduleOnRN(onCollapsed)
        }
      },
    ),
  }))

  return (
    <Animated.View style={[a.overflow_hidden, style]}>
      {/*
       * Out of flow, so it lays out at its full height however tall the clip
       * is, to measure. In flow, Yoga would size it to fit the clip's height,
       * which starts at 0.
       */}
      <View
        style={[a.absolute, a.top_0, a.left_0, a.right_0]}
        onLayout={event => contentHeight.set(event.nativeEvent.layout.height)}>
        {children}
      </View>
    </Animated.View>
  )
}
