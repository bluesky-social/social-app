import {
  type JSX,
  useCallback,
  useContext,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import {View} from 'react-native'
import {DrawerGestureContext} from 'react-native-drawer-layout'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import {type SharedValue, useSharedValue} from 'react-native-reanimated'
import {useFocusEffect} from '@react-navigation/native'

import {useSetDrawerSwipeDisabled} from '#/state/shell'
import {atoms as a, native} from '#/alf'

export type PageSelectedEvent = any

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

export function Pager({
  ref,
  children,
  initialPage = 0,
  renderTabBar,
  onTabPressed: parentOnTabPressed,
  testID,
}: React.PropsWithChildren<Props>) {
  const [selectedPage] = useState(initialPage)
  const pagerView = useRef<any>(null)

  const [isIdle] = useState(true)
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

  const onTabBarSelect = useCallback(
    (index: number) => {
      parentOnTabPressed?.(index)
      pagerView.current?.setPage(index)
    },
    [pagerView, parentOnTabPressed],
  )

  const dragState = useSharedValue<'idle' | 'settling' | 'dragging'>('idle')
  const dragProgress = useSharedValue(selectedPage)

  return (
    <View testID={testID} style={[a.flex_1, native(a.overflow_hidden)]}>
      {renderTabBar({
        selectedPage,
        onSelect: onTabBarSelect,
        dragProgress,
        dragState,
      })}
      <DrawerGestureRequireFail>{children}</DrawerGestureRequireFail>
    </View>
  )
}

function DrawerGestureRequireFail({children}: {children: React.ReactNode}) {
  const drawerGesture = useContext(DrawerGestureContext)

  const nativeGesture = useMemo(() => {
    const gesture = Gesture.Native()
    if (drawerGesture) {
      gesture.requireExternalGestureToFail(drawerGesture)
    }
    return gesture
  }, [drawerGesture])

  return <GestureDetector gesture={nativeGesture}>{children}</GestureDetector>
}
