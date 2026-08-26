import {
  Children,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  type NativeSyntheticEvent,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native'
import {DrawerGestureContext} from 'react-native-drawer-layout'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import NativePagerView from 'react-native-pager-view'
import {
  type PagerViewOnPageScrollEventData,
  type PagerViewOnPageSelectedEventData,
  type PageScrollStateChangedNativeEventData,
} from 'react-native-pager-view'
import Animated, {useEvent, useSharedValue} from 'react-native-reanimated'
import {scheduleOnRN} from 'react-native-worklets'
import {useFocusEffect} from '@react-navigation/native'

import {useSetDrawerSwipeDisabled} from '#/state/shell'
import {atoms as a} from '#/alf'
import {usePagerContext} from './context'

const AnimatedPagerView = Animated.createAnimatedComponent(NativePagerView)
const MemoizedAnimatedPagerView = memo(AnimatedPagerView)

export function Content({
  children,
  manageDrawerGesture = false,
  style,
  testID,
}: {
  children: React.ReactNode
  manageDrawerGesture?: boolean
  style?: StyleProp<ViewStyle>
  testID?: string
}) {
  const {
    initialPage,
    selectedPage,
    dragProgress,
    dragState,
    onPageSelected,
    onPageScrollStateChanged,
  } = usePagerContext()
  const pagerRef = useRef<NativePagerView>(null)
  const currentPage = useRef(initialPage)
  const [isIdle, setIsIdle] = useState(true)
  const setDrawerSwipeDisabled = useSetDrawerSwipeDisabled()

  useFocusEffect(
    useCallback(() => {
      if (!manageDrawerGesture) return

      const canSwipeDrawer = selectedPage === 0 && isIdle
      setDrawerSwipeDisabled(!canSwipeDrawer)
      return () => setDrawerSwipeDisabled(false)
    }, [manageDrawerGesture, setDrawerSwipeDisabled, selectedPage, isIdle]),
  )

  useEffect(() => {
    if (selectedPage !== currentPage.current) {
      currentPage.current = selectedPage
      pagerRef.current?.setPage(selectedPage)
    }
  }, [selectedPage])

  const handlePageSelected = useCallback(
    (page: number) => {
      currentPage.current = page
      onPageSelected(page)
    },
    [onPageSelected],
  )

  const handlePageScrollStateChanged = useCallback(
    (state: 'idle' | 'dragging' | 'settling') => {
      setIsIdle(state === 'idle')
      onPageScrollStateChanged(state)
    },
    [onPageScrollStateChanged],
  )

  const didInit = useSharedValue(false)
  const handlePageScroll = useEvent<PagerNativeEvent>(
    event => {
      'worklet'
      if (event.eventName.endsWith('onPageScroll') && 'offset' in event) {
        if (didInit.get() === false) {
          // iOS emits a spurious zero-position event before confirming the
          // supplied initial page.
          return
        }
        dragProgress.set(event.offset + event.position)
      } else if (
        event.eventName.endsWith('onPageScrollStateChanged') &&
        'pageScrollState' in event
      ) {
        scheduleOnRN(handlePageScrollStateChanged, event.pageScrollState)
        if (
          dragState.get() === 'idle' &&
          event.pageScrollState === 'settling'
        ) {
          // Android reports programmatic paging as a settling gesture. Keep
          // this idle so tab bars can distinguish taps from direct swipes.
          return
        }
        dragState.set(event.pageScrollState)
      } else if (
        event.eventName.endsWith('onPageSelected') &&
        'position' in event
      ) {
        didInit.set(true)
        dragProgress.set(event.position)
        scheduleOnRN(handlePageSelected, event.position)
      }
    },
    ['onPageScroll', 'onPageScrollStateChanged', 'onPageSelected'],
    true,
  )

  const content = (
    <MemoizedAnimatedPagerView
      ref={pagerRef}
      testID={testID}
      style={[a.flex_1, style]}
      initialPage={initialPage}
      onPageScroll={handlePageScroll}>
      {Children.map(children, child => (
        <View collapsable={false} style={a.flex_1}>
          {child}
        </View>
      ))}
    </MemoizedAnimatedPagerView>
  )

  return manageDrawerGesture ? (
    <DrawerGestureRequireFail>{content}</DrawerGestureRequireFail>
  ) : (
    content
  )
}

type PagerEventData =
  | PagerViewOnPageScrollEventData
  | PagerViewOnPageSelectedEventData
  | PageScrollStateChangedNativeEventData

type PagerNativeEvent = NativeSyntheticEvent<PagerEventData>

function DrawerGestureRequireFail({children}: {children: React.ReactNode}) {
  const drawerGesture = useContext(DrawerGestureContext)
  const pagerGesture = useMemo(() => {
    const gesture = Gesture.Native()
    if (drawerGesture) {
      gesture.requireExternalGestureToFail(drawerGesture)
    }
    return gesture
  }, [drawerGesture])

  return <GestureDetector gesture={pagerGesture}>{children}</GestureDetector>
}
