import {
  Children,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {type StyleProp, View, type ViewStyle} from 'react-native'
import {DrawerGestureContext} from 'react-native-drawer-layout'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import NativePagerView from 'react-native-pager-view'
import {useFocusEffect} from '@react-navigation/native'

import {useSetDrawerSwipeDisabled} from '#/state/shell'
import {atoms as a} from '#/alf'
import {usePagerContext} from './context'

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
  const {initialPage, selectedPage, onPageSelected, onPageScrollStateChanged} =
    usePagerContext()
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

  const content = (
    <NativePagerView
      ref={pagerRef}
      testID={testID}
      style={[a.flex_1, style]}
      initialPage={initialPage}
      onPageSelected={event => {
        const page = event.nativeEvent.position
        currentPage.current = page
        onPageSelected(page)
      }}
      onPageScrollStateChanged={event => {
        const state = event.nativeEvent.pageScrollState
        setIsIdle(state === 'idle')
        onPageScrollStateChanged(state)
      }}>
      {Children.map(children, child => (
        <View collapsable={false} style={a.flex_1}>
          {child}
        </View>
      ))}
    </NativePagerView>
  )

  return manageDrawerGesture ? (
    <DrawerGestureRequireFail>{content}</DrawerGestureRequireFail>
  ) : (
    content
  )
}

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
