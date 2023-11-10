import * as React from 'react'
import {
  FlatList,
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import Animated, {
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
  scrollTo,
  useAnimatedRef,
  SharedValue,
} from 'react-native-reanimated'
import {Pager, PagerRef, RenderTabBarFnProps} from 'view/com/pager/Pager'
import {TabBar} from './TabBar'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {OnScrollCb} from 'lib/hooks/useOnMainScroll'

interface PagerWithHeaderChildParams {
  headerHeight: number
  onScroll: OnScrollCb
  isScrolledDown: boolean
  scrollElRef: React.MutableRefObject<FlatList<any> | ScrollView | null>
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
    const clampedScrollY = useSharedValue(0)
    const [tabBarHeight, setTabBarHeight] = React.useState(0)
    const [headerOnlyHeight, setHeaderOnlyHeight] = React.useState(0)
    const [isScrolledDown, setIsScrolledDown] = React.useState(false)
    const headerHeight = headerOnlyHeight + tabBarHeight
    const headerOnlyHeightShared = useSharedValue(0)

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
        headerOnlyHeightShared.value = evt.nativeEvent.layout.height
      },
      [setHeaderOnlyHeight, headerOnlyHeightShared],
    )

    // render the the header and tab bar
    const headerTransform = useAnimatedStyle(
      () => ({
        transform: [
          {
            translateY: Math.min(-clampedScrollY.value, 0),
          },
        ],
      }),
      [clampedScrollY, headerHeight, tabBarHeight],
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

    const scrollRefs = useSharedValue([])
    const registerRef = (ref, index) => {
      lolWut()
      scrollRefs.modify(refs => {
        'worklet'
        refs[index] = ref
        return refs
      })
    }

    // props to pass into children render functions
    const onScroll = useAnimatedScrollHandler({
      onScroll(e) {
        // TODO: We should be able to use headerOnlyHeight directly here, but on the web
        // there seems is a bug in Reanimated causing state inside this function to be stale.
        clampedScrollY.value = Math.min(
          e.contentOffset.y,
          headerOnlyHeightShared.value,
        )

        if (e.contentOffset.y < headerOnlyHeightShared.value) {
          const refs = scrollRefs.value
          for (let i = 0; i < refs.length; i++) {
            scrollTo(refs[i], 0, e.contentOffset.y, false)
          }
        }
      },
    })
    useAnimatedReaction(
      () => clampedScrollY.value === headerOnlyHeight,
      (nextIsScrolledDown, prevIsScrolledDown) => {
        if (nextIsScrolledDown !== prevIsScrolledDown) {
          runOnJS(setIsScrolledDown)(nextIsScrolledDown)
        }
      },
    )

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
                  registerRef={ref => {
                    lolWut()
                    registerRef(ref, i)
                  }}
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

function lolWut() {
  console.log('hi')
}

function PagerItem({
  headerHeight,
  isScrolledDown,
  onScroll,
  renderTab,
  registerRef,
}: {
  headerHeight: number
  isScrolledDown: boolean
  forcedScrollY: SharedValue<number> | null
  onScroll: OnScrollCb
  renderTab: ((props: PagerWithHeaderChildParams) => JSX.Element) | null
}) {
  lolWut()
  const scrollElRef = useAnimatedRef()
  registerRef(scrollElRef)
  if (renderTab == null) {
    return null
  }
  return renderTab({
    headerHeight,
    isScrolledDown,
    onScroll,
    scrollElRef: scrollElRef as React.MutableRefObject<
      FlatList<any> | ScrollView | null
    >,
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
