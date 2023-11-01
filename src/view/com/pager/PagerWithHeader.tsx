import * as React from 'react'
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import {Pager, PagerRef, RenderTabBarFnProps} from 'view/com/pager/Pager'
import {TabBar} from './TabBar'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {OnScrollCb} from 'lib/hooks/useOnMainScroll'

interface PagerWithHeaderChildParams {
  headerHeight: number
  onScroll: OnScrollCb
}

export interface PagerWithHeaderProps {
  testID?: string
  children: (((props: PagerWithHeaderChildParams) => JSX.Element) | null)[]
  items: string[]
  renderHeader?: () => JSX.Element
  initialPage?: number
  onPageSelected?: (index: number) => void
  onCurrentPageSelected?: () => void
}
export const PagerWithHeader = React.forwardRef<PagerRef, PagerWithHeaderProps>(
  function PageWithHeaderImpl(
    {
      children,
      testID,
      items,
      renderHeader,
      initialPage,
      onPageSelected,
      onCurrentPageSelected,
    }: PagerWithHeaderProps,
    ref,
  ) {
    const {isMobile} = useWebMediaQueries()
    const scrollYs = React.useRef<Record<number, number>>({})
    const [currentPage, setCurrentPage] = React.useState(0)
    const scrollY = useSharedValue(scrollYs.current[currentPage] || 0)
    const [tabBarHeight, setTabBarHeight] = React.useState(0)
    const [headerHeight, setHeaderHeight] = React.useState(0)
    const headerTransform = useAnimatedStyle(
      () => ({
        transform: [
          {
            translateY: scrollY.value * -1,
          },
        ],
      }),
      [scrollY, headerHeight, tabBarHeight],
    )

    const onTabBarLayout = React.useCallback(
      (evt: LayoutChangeEvent) => {
        setTabBarHeight(evt.nativeEvent.layout.height)
      },
      [setTabBarHeight],
    )

    const onHeaderLayout = React.useCallback(
      (evt: LayoutChangeEvent) => {
        setHeaderHeight(evt.nativeEvent.layout.height)
      },
      [setHeaderHeight],
    )

    const renderTabBar = React.useCallback(
      (props: RenderTabBarFnProps) => {
        return (
          <Animated.View
            onLayout={onHeaderLayout}
            style={[
              isMobile ? styles.tabBarMobile : styles.tabBarDesktop,
              headerTransform,
            ]}>
            {renderHeader?.()}
            <TabBar
              items={items}
              selectedPage={currentPage}
              onSelect={props.onSelect}
              onPressSelected={onCurrentPageSelected}
              onLayout={onTabBarLayout}
            />
          </Animated.View>
        )
      },
      [
        items,
        renderHeader,
        headerTransform,
        currentPage,
        onCurrentPageSelected,
        isMobile,
        onTabBarLayout,
        onHeaderLayout,
      ],
    )

    const childProps = React.useMemo<PagerWithHeaderChildParams>(() => {
      return {
        headerHeight,
        onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
          const v = clamped(
            event.nativeEvent.contentOffset.y,
            headerHeight,
            tabBarHeight,
          )
          scrollY.value = v
          scrollYs.current[currentPage] = v
        },
      }
    }, [headerHeight, tabBarHeight, scrollY, scrollYs, currentPage])

    const onPageSelectedInner = React.useCallback(
      (index: number) => {
        setCurrentPage(index)
        onPageSelected?.(index)
      },
      [onPageSelected, setCurrentPage],
    )

    const onPageSelecting = React.useCallback(
      (index: number) => {
        setCurrentPage(index)
        scrollY.value = withTiming(scrollYs.current[index] || 0, {
          duration: 170,
          easing: Easing.inOut(Easing.quad),
        })
      },
      [scrollY, setCurrentPage, scrollYs],
    )

    return (
      <Pager
        ref={ref}
        testID={testID}
        initialPage={initialPage}
        onPageSelected={onPageSelectedInner}
        onPageSelecting={onPageSelecting}
        renderTabBar={renderTabBar}
        tabBarPosition="top">
        {children.filter(Boolean).map(child => {
          // TODO- how can keys get passed here?
          if (child) {
            return child(childProps)
          }
          return null
        })}
      </Pager>
    )
  },
)

const styles = StyleSheet.create({
  tabBarMobile: {
    position: 'absolute',
    zIndex: 1,
    top: 0,
    left: 0,
    width: '100%',
  },
  tabBarDesktop: {
    position: 'absolute',
    zIndex: 1,
    top: 0,
    // @ts-ignore Web only -prf
    left: 'calc(50% - 299px)',
    width: 598,
  },
})

function clamped(value: number, headerHeight: number, tabBarHeight: number) {
  return Math.min(Math.max(value, 0), headerHeight - tabBarHeight)
}
