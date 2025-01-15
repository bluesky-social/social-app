import React, {Children, forwardRef, useCallback, useContext} from 'react'
import {View} from 'react-native'
import {DrawerGestureContext} from 'react-native-drawer-layout'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import PagerView, {
  PagerViewOnPageScrollEventData,
  PagerViewOnPageSelectedEvent,
  PagerViewOnPageSelectedEventData,
  PageScrollStateChangedNativeEventData,
} from 'react-native-pager-view'
import Animated, {
  runOnJS,
  SharedValue,
  useEvent,
  useHandler,
  useSharedValue,
} from 'react-native-reanimated'
import {useFocusEffect} from '@react-navigation/native'

import {isAndroid} from '#/platform/detection'
import {useSetDrawerSwipeDisabled} from '#/state/shell'
import {atoms as a, native} from '#/alf'

export type PageSelectedEvent = PagerViewOnPageSelectedEvent

export interface PagerRef {
  setPage: (index: number) => void
}

export interface RenderTabBarFnProps {
  selectedPage: number
  onSelect?: (index: number) => void
  tabBarAnchor?: JSX.Element | null | undefined // Ignored on native.
  dragProgress: SharedValue<number> // Ignored on web.
  dragState: SharedValue<'idle' | 'dragging' | 'settling'> // Ignored on web.
}
export type RenderTabBarFn = (props: RenderTabBarFnProps) => JSX.Element

interface Props {
  initialPage?: number
  renderTabBar: RenderTabBarFn
  onPageSelected?: (index: number) => void
  onPageScrollStateChanged?: (
    scrollState: 'idle' | 'dragging' | 'settling',
  ) => void
  testID?: string
}

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView)

export const Pager = forwardRef<PagerRef, React.PropsWithChildren<Props>>(
  function PagerImpl(
    {
      children,
      initialPage = 0,
      renderTabBar,
      onPageScrollStateChanged: parentOnPageScrollStateChanged,
      onPageSelected: parentOnPageSelected,
      testID,
    }: React.PropsWithChildren<Props>,
    ref,
  ) {
    const [selectedPage, setSelectedPage] = React.useState(initialPage)
    const pagerView = React.useRef<PagerView>(null)

    const [isIdle, setIsIdle] = React.useState(true)
    const setDrawerSwipeDisabled = useSetDrawerSwipeDisabled()
    useFocusEffect(
      useCallback(() => {
        const canSwipeDrawer = selectedPage === 0 && isIdle
        setDrawerSwipeDisabled(!canSwipeDrawer)
        return () => {
          setDrawerSwipeDisabled(false)
        }
      }, [setDrawerSwipeDisabled, selectedPage, isIdle]),
    )

    React.useImperativeHandle(ref, () => ({
      setPage: (index: number) => {
        pagerView.current?.setPage(index)
      },
    }))

    const onPageSelectedJSThread = React.useCallback(
      (nextPosition: number) => {
        setSelectedPage(nextPosition)
        parentOnPageSelected?.(nextPosition)
      },
      [setSelectedPage, parentOnPageSelected],
    )

    const onTabBarSelect = React.useCallback(
      (index: number) => {
        pagerView.current?.setPage(index)
      },
      [pagerView],
    )

    const dragState = useSharedValue<'idle' | 'settling' | 'dragging'>('idle')
    const dragProgress = useSharedValue(selectedPage)
    const didInit = useSharedValue(false)
    const handlePageScroll = usePagerHandlers(
      {
        onPageScroll(e: PagerViewOnPageScrollEventData) {
          'worklet'
          if (didInit.get() === false) {
            // On iOS, there's a spurious scroll event with 0 position
            // even if a different page was supplied as the initial page.
            // Ignore it and wait for the first confirmed selection instead.
            return
          }
          dragProgress.set(e.offset + e.position)
        },
        onPageScrollStateChanged(e: PageScrollStateChangedNativeEventData) {
          'worklet'
          runOnJS(setIsIdle)(e.pageScrollState === 'idle')
          if (dragState.get() === 'idle' && e.pageScrollState === 'settling') {
            // This is a programmatic scroll on Android.
            // Stay "idle" to match iOS and avoid confusing downstream code.
            return
          }
          dragState.set(e.pageScrollState)
          parentOnPageScrollStateChanged?.(e.pageScrollState)
        },
        onPageSelected(e: PagerViewOnPageSelectedEventData) {
          'worklet'
          didInit.set(true)
          runOnJS(onPageSelectedJSThread)(e.position)
        },
      },
      [parentOnPageScrollStateChanged],
    )

    const drawerGesture = useContext(DrawerGestureContext) ?? Gesture.Native() // noop for web
    const nativeGesture =
      Gesture.Native().requireExternalGestureToFail(drawerGesture)

    return (
      <View testID={testID} style={[a.flex_1, native(a.overflow_hidden)]}>
        {renderTabBar({
          selectedPage,
          onSelect: onTabBarSelect,
          dragProgress,
          dragState,
        })}
        <GestureDetector gesture={nativeGesture}>
          <AnimatedPagerView
            ref={pagerView}
            style={[a.flex_1]}
            initialPage={initialPage}
            onPageScroll={handlePageScroll}>
            {isAndroid
              ? Children.map(children, child => (
                  <CaptureSwipesAndroid>{child}</CaptureSwipesAndroid>
                ))
              : children}
          </AnimatedPagerView>
        </GestureDetector>
      </View>
    )
  },
)

// HACK.
// This works around https://github.com/callstack/react-native-pager-view/issues/960.
// It appears that the Pressables inside the pager get confused if there's enough work
// happening on the JS thread, and mistakingly interpret a pager swipe as a tap.
// We can prevent this by stealing all horizontal movements from the tree inside.
function CaptureSwipesAndroid({children}: {children: React.ReactNode}) {
  const lastTouchStart = React.useRef<{x: number; y: number} | null>(null)
  return (
    <View
      onTouchStart={e => {
        lastTouchStart.current = {
          x: e.nativeEvent.pageX,
          y: e.nativeEvent.pageY,
        }
      }}
      onMoveShouldSetResponderCapture={e => {
        const coords = lastTouchStart.current
        if (!coords) {
          return false
        }
        const dx = Math.abs(e.nativeEvent.pageX - coords.x)
        if (dx > 0) {
          // This is a horizontal movement and will result in a swipe.
          // Prevent pager children from receiving this touch.
          return true
        }
        return false
      }}>
      {children}
    </View>
  )
}

function usePagerHandlers(
  handlers: {
    onPageScroll: (e: PagerViewOnPageScrollEventData) => void
    onPageScrollStateChanged: (e: PageScrollStateChangedNativeEventData) => void
    onPageSelected: (e: PagerViewOnPageSelectedEventData) => void
  },
  dependencies: unknown[],
) {
  const {doDependenciesDiffer} = useHandler(handlers as any, dependencies)
  const subscribeForEvents = [
    'onPageScroll',
    'onPageScrollStateChanged',
    'onPageSelected',
  ]
  return useEvent(
    event => {
      'worklet'
      const {onPageScroll, onPageScrollStateChanged, onPageSelected} = handlers
      if (event.eventName.endsWith('onPageScroll')) {
        onPageScroll(event as any as PagerViewOnPageScrollEventData)
      } else if (event.eventName.endsWith('onPageScrollStateChanged')) {
        onPageScrollStateChanged(
          event as any as PageScrollStateChangedNativeEventData,
        )
      } else if (event.eventName.endsWith('onPageSelected')) {
        onPageSelected(event as any as PagerViewOnPageSelectedEventData)
      }
    },
    subscribeForEvents,
    doDependenciesDiffer,
  )
}
