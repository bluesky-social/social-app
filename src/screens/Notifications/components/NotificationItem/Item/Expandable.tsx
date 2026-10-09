import {useLayoutEffect, useRef, useState} from 'react'
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

const TIMING = {duration: 200, easing: Easing.out(Easing.cubic)}

/**
 * Content revealed beneath a row's header, e.g. an expanded list of actors.
 * It grows from nothing to the height of `children` when `expanded`, and
 * shrinks away again when not, unmounting once it's closed. Rows below it in
 * the list move with it, and if `children` change height while open, e.g.
 * after "Show more", that animates too. With reduced motion it just shows or
 * hides.
 *
 * Screen readers can't reach the content while it's opening or closing.
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
 *
 * Opening without a flash of the full height takes two commits, of which only
 * the second is painted:
 *
 * 1. It mounts with no height, so the content lays out at its natural height.
 *    It can't be measured inside a closed clip, since Yoga skips laying out
 *    the children of a 0-tall box and reports them as 0 tall.
 * 2. The layout effect measures it and sets state. An update from a layout
 *    effect renders and commits before the frame is drawn, on the New
 *    Architecture as on web, so the first commit is never painted. The second
 *    pins the height at 0 and attaches the animated style, which grows it
 *    from there on the UI thread.
 *
 * The animated style can't close the clip itself. On the view's first render
 * Reanimated puts its initial value in React's props, which would close the
 * clip before it's measured. After that it only applies values on the UI
 * thread, which can be a frame after the commit is drawn.
 *
 * Once open it keeps a fixed height and follows the content, rather than
 * going back to auto. Reanimated syncs a settled animation's values back into
 * React state, applied after the view's own style, so React couldn't take the
 * height back to pin it again. Fully open, the clip is as tall as the
 * content, so the content lays out at its natural height and `onLayout`
 * reports when that changes, e.g. after "Show more". The clip animates to
 * match, and until then new rows are clipped rather than pushing the rows
 * below down for a frame. While opening or closing, the clip is shorter than
 * the content and Yoga squeezes it to fit, so `onLayout` is ignored then.
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
  const contentRef = useRef<React.ComponentRef<typeof View>>(null)
  /**
   * The content's natural height. 0 until it's measured, which is where the
   * opening animation starts from.
   */
  const contentHeight = useSharedValue(0)
  const [isMeasured, setIsMeasured] = useState(false)
  /**
   * Finished opening, so nothing is clipped.
   */
  const [isOpen, setIsOpen] = useState(false)
  if (!expanded && isOpen) {
    setIsOpen(false)
  }

  useLayoutEffect(() => {
    const rect = contentRef.current?.getBoundingClientRect()
    contentHeight.set(rect?.height ?? 0)
    setIsMeasured(true)
  }, [contentHeight])

  /*
   * Reanimated restarts the animation whenever something this captures
   * changes, so the callbacks are stable ones: a state setter, and
   * `onCollapsed`, which the compiler memoizes in `Expandable`. Functions
   * declared here wouldn't be, since the compiler doesn't memoize values passed
   * into a worklet.
   */
  const style = useAnimatedStyle(() => ({
    height: withTiming(expanded ? contentHeight.get() : 0, TIMING, finished => {
      if (!finished) return
      if (expanded) {
        scheduleOnRN(setIsOpen, true)
      } else {
        scheduleOnRN(onCollapsed)
      }
    }),
  }))

  return (
    <Animated.View
      // Hidden from screen readers while it's clipped or about to unmount
      aria-hidden={!isOpen}
      style={[a.overflow_hidden, isMeasured && [{height: 0}, style]]}>
      <View
        ref={contentRef}
        onLayout={event => {
          if (isOpen) {
            contentHeight.set(event.nativeEvent.layout.height)
          }
        }}>
        {children}
      </View>
    </Animated.View>
  )
}
