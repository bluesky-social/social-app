import * as React from 'react'
import {LayoutChangeEvent, StyleSheet, View} from 'react-native'
import Animated, {
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
  useAnimatedRef,
} from 'react-native-reanimated'
import {Pager, PagerRef, RenderTabBarFnProps} from 'view/com/pager/Pager'
import {TabBar} from './TabBar'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {OnScrollCb} from 'lib/hooks/useOnMainScroll'

const SCROLLED_DOWN_LIMIT = 200

interface PagerWithHeaderChildParams {
  headerHeight: number
  onScroll: OnScrollCb
  isScrolledDown: boolean
  scrollElRef: any /* TODO */
}

export interface PagerWithHeaderProps {
  testID?: string
  children:
    | (((props: PagerWithHeaderChildParams) => JSX.Element) | null)[]
    | ((props: PagerWithHeaderChildParams) => JSX.Element)
  items: string[]
  isHeaderReady: boolean
  renderHeader?: () => JSX.Element
  initialPage?: number
  onPageSelected?: (index: number) => void
  onCurrentPageSelected?: (index: number) => void
}
export const PagerWithHeader = React.forwardRef<PagerRef, PagerWithHeaderProps>(
  function PageWithHeaderImpl(
    {
      children,
      testID,
      items,
      isHeaderReady,
      renderHeader,
      initialPage,
      onPageSelected,
      onCurrentPageSelected,
    }: PagerWithHeaderProps,
    ref,
  ) {
    const {isMobile} = useWebMediaQueries()
    const [currentPage, setCurrentPage] = React.useState(0)
    const scrollY = useSharedValue(0)
    const [tabBarHeight, setTabBarHeight] = React.useState(0)
    const [headerOnlyHeight, setHeaderOnlyHeight] = React.useState(0)
    const [isScrolledDown, setIsScrolledDown] = React.useState(false)

    const headerHeight = headerOnlyHeight + tabBarHeight

    function onScrollUpdate(v: number) {
      setIsScrolledDown(v > SCROLLED_DOWN_LIMIT)
    }
    useAnimatedReaction(
      () => scrollY.value,
      v => runOnJS(onScrollUpdate)(v),
    )

    // capture the header bar sizing
    const onTabBarLayout = React.useCallback(
      (evt: LayoutChangeEvent) => {
        setTabBarHeight(evt.nativeEvent.layout.height)
      },
      [setTabBarHeight],
    )
    const onHeaderOnlyLayout = React.useCallback(
      (evt: LayoutChangeEvent) => {
        setHeaderOnlyHeight(evt.nativeEvent.layout.height)
      },
      [setHeaderOnlyHeight],
    )

    // render the the header and tab bar
    const headerTransform = useAnimatedStyle(
      () => ({
        transform: [
          {
            translateY: Math.min(
              Math.min(scrollY.value, headerOnlyHeight) * -1,
              0,
            ),
          },
        ],
      }),
      [scrollY, headerHeight, tabBarHeight],
    )
    const renderTabBar = React.useCallback(
      (props: RenderTabBarFnProps) => {
        return (
          <Animated.View
            style={[
              isMobile ? styles.tabBarMobile : styles.tabBarDesktop,
              headerTransform,
            ]}>
            <View onLayout={onHeaderOnlyLayout}>{renderHeader?.()}</View>
            <View
              onLayout={onTabBarLayout}
              style={{
                // Render it immediately to measure it early since its size doesn't depend on the content.
                // However, keep it invisible until the header above stabilizes in order to prevent jumps.
                opacity: isHeaderReady ? 1 : 0,
                pointerEvents: isHeaderReady ? 'auto' : 'none',
              }}>
              <TabBar
                items={items}
                selectedPage={currentPage}
                onSelect={props.onSelect}
                onPressSelected={onCurrentPageSelected}
              />
            </View>
          </Animated.View>
        )
      },
      [
        items,
        isHeaderReady,
        renderHeader,
        headerTransform,
        currentPage,
        onCurrentPageSelected,
        isMobile,
        onTabBarLayout,
        onHeaderOnlyLayout,
      ],
    )

    // props to pass into children render functions
    const onScroll = useAnimatedScrollHandler({
      onScroll(e) {
        scrollY.value = e.contentOffset.y
      },
    })

    const onPageSelectedInner = React.useCallback(
      (index: number) => {
        setCurrentPage(index)
        onPageSelected?.(index)
      },
      [onPageSelected, setCurrentPage],
    )

    const onPageSelecting = React.useCallback((index: number) => {
      setCurrentPage(index)
    }, [])

    return (
      <Pager
        ref={ref}
        testID={testID}
        initialPage={initialPage}
        onPageSelected={onPageSelectedInner}
        onPageSelecting={onPageSelecting}
        renderTabBar={renderTabBar}
        tabBarPosition="top">
        {toArray(children)
          .filter(Boolean)
          .map((child, i) => {
            return (
              <View key={i} collapsable={false}>
                <PagerItem
                  headerHeight={headerHeight}
                  isScrolledDown={isScrolledDown}
                  onScroll={i === currentPage ? onScroll : noop}
                  renderTab={
                    isHeaderReady && headerOnlyHeight > 0 && tabBarHeight > 0
                      ? child
                      : null
                  }
                />
              </View>
            )
          })}
      </Pager>
    )
  },
)

function PagerItem(
  {headerHeight, isScrolledDown, onScroll, renderTab}: any /* TODO */,
) {
  const scrollElRef = useAnimatedRef()
  if (renderTab == null) {
    return null
  }
  return renderTab({
    headerHeight,
    isScrolledDown,
    onScroll,
    scrollElRef,
  })
}

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

function noop() {}

function toArray<T>(v: T | T[]): T[] {
  if (Array.isArray(v)) {
    return v
  }
  return [v]
}
