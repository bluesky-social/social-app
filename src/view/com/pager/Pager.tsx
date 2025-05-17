import {
  useCallback,
  useContext,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import {View} from 'react-native'
import {DrawerGestureContext} from 'react-native-drawer-layout'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import PagerView, {
  type PagerViewOnPageScrollEventData,
  type PagerViewOnPageSelectedEvent,
  type PagerViewOnPageSelectedEventData,
  type PageScrollStateChangedNativeEventData,
} from 'react-native-pager-view'
import Animated, {
  runOnJS,
  type SharedValue,
  useEvent,
  useHandler,
  useSharedValue,
} from 'react-native-reanimated'
import {useFocusEffect} from '@react-navigation/native'

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
  ref?: React.Ref<PagerRef>
  initialPage?: number
  renderTabBar: RenderTabBarFn
  // tab pressed, yet to scroll to page
  onTabPressed?: (index: number) => void
  // scroll settled
  onPageSelected?: (index: number) => void
  onPageScrollStateChanged?: (
    scrollState: 'idle' | 'dragging' | 'settling',
  ) => void
  testID?: string
}

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView)

export function Pager({
  ref,
  children,
  initialPage = 0,
  renderTabBar,
  onPageSelected: parentOnPageSelected,
  onTabPressed: parentOnTabPressed,
  onPageScrollStateChanged: parentOnPageScrollStateChanged,
  testID,
}: React.PropsWithChildren<Props>) {
  const [selectedPage, setSelectedPage] = useState(initialPage)
  const pagerView = useRef<PagerView>(null)

  const [isIdle, setIsIdle] = useState(true)
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

  useImperativeHandle(ref, () => ({
    setPage: (index: number) => {
      pagerView.current?.setPage(index)
    },
  }))

  const onPageSelectedJSThread = useCallback(
    (nextPosition: number) => {
      setSelectedPage(nextPosition)
      parentOnPageSelected?.(nextPosition)
    },
    [setSelectedPage, parentOnPageSelected],
  )

  const onTabBarSelect = useCallback(
    (index: number) => {
      parentOnTabPressed?.(index)
      pagerView.current?.setPage(index)
    },
    [pagerView, parentOnTabPressed],
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
          {children}
        </AnimatedPagerView>
      </GestureDetector>
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
