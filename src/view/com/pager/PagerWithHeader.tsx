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
            translateY: clampedInvert(
              scrollY.value,
              headerHeight,
              tabBarHeight,
            ),
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
              selectedPage={props.selectedPage}
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
          scrollY.value = event.nativeEvent.contentOffset.y
          scrollYs.current[currentPage] = event.nativeEvent.contentOffset.y
        },
      }
    }, [headerHeight, scrollY, scrollYs, currentPage])

    const onPageSelectedInner = React.useCallback(
      (index: number) => {
        setCurrentPage(index)
        scrollY.value = withTiming(scrollYs.current[index] || 0, {
          duration: 300,
        })
        onPageSelected?.(index)
      },
      [scrollY, onPageSelected, setCurrentPage, scrollYs],
    )

    return (
      <Pager
        ref={ref}
        testID={testID}
        initialPage={initialPage}
        onPageSelected={onPageSelectedInner}
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

function clampedInvert(
  value: number,
  headerHeight: number,
  tabBarHeight: number,
) {
  'worklet'
  return Math.min(Math.max(value, 0), headerHeight - tabBarHeight) * -1
}
