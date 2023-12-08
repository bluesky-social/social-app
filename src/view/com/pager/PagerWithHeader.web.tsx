import * as React from 'react'
import {
  FlatList,
  ScrollView,
  StyleSheet,
  View,
  NativeScrollEvent,
} from 'react-native'
import {useSharedValue, runOnJS, useAnimatedRef} from 'react-native-reanimated'
import {Pager, PagerRef, RenderTabBarFnProps} from 'view/com/pager/Pager'
import {TabBar} from './TabBar'
import {OnScrollHandler} from 'lib/hooks/useOnMainScroll'
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'

const SCROLLED_DOWN_LIMIT = 200

export interface PagerWithHeaderChildParams {
  headerHeight: number
  isFocused: boolean
  onScroll: OnScrollHandler
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
      renderHeader,
      initialPage,
      onPageSelected,
      onCurrentPageSelected,
    }: PagerWithHeaderProps,
    ref,
  ) {
    const [currentPage, setCurrentPage] = React.useState(0)
    const [isScrolledDown, setIsScrolledDown] = React.useState(false)
    const scrollY = useSharedValue(0)

    const renderTabBar = React.useCallback(
      (props: RenderTabBarFnProps) => {
        return (
          <PagerTabBar
            items={items}
            renderHeader={renderHeader}
            currentPage={currentPage}
            onCurrentPageSelected={onCurrentPageSelected}
            onSelect={props.onSelect}
            testID={testID}
          />
        )
      },
      [items, renderHeader, currentPage, onCurrentPageSelected, testID],
    )

    const throttleTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(
      null,
    )
    const queueThrottledOnScroll = useNonReactiveCallback(() => {
      if (!throttleTimeout.current) {
        throttleTimeout.current = setTimeout(() => {
          throttleTimeout.current = null

          const nextIsScrolledDown = scrollY.value > SCROLLED_DOWN_LIMIT
          if (isScrolledDown !== nextIsScrolledDown) {
            React.startTransition(() => {
              setIsScrolledDown(nextIsScrolledDown)
            })
          }
        }, 80)
      }
    })

    const onScrollWorklet = React.useCallback(
      (e: NativeScrollEvent) => {
        'worklet'
        const nextScrollY = e.contentOffset.y
        scrollY.value = nextScrollY
        runOnJS(queueThrottledOnScroll)()
      },
      [scrollY, queueThrottledOnScroll],
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
                  isFocused={i === currentPage}
                  isScrolledDown={isScrolledDown}
                  onScrollWorklet={i === currentPage ? onScrollWorklet : noop}
                  renderTab={child}
                />
              </View>
            )
          })}
      </Pager>
    )
  },
)

let PagerTabBar = ({
  currentPage,
  items,
  testID,
  renderHeader,
  onCurrentPageSelected,
  onSelect,
}: {
  currentPage: number
  items: string[]
  testID?: string
  renderHeader?: () => JSX.Element
  onCurrentPageSelected?: (index: number) => void
  onSelect?: (index: number) => void
}): React.ReactNode => {
  const pal = usePalette('default')
  const {isMobile} = useWebMediaQueries()
  return (
    <>
      <View style={[!isMobile && styles.headerContainerDesktop, pal.border]}>
        {renderHeader?.()}
      </View>
      <View
        style={[
          styles.tabBarContainer,
          isMobile
            ? styles.tabBarContainerMobile
            : styles.tabBarContainerDesktop,
          pal.border,
        ]}>
        <TabBar
          testID={testID}
          items={items}
          selectedPage={currentPage}
          onSelect={onSelect}
          onPressSelected={onCurrentPageSelected}
        />
      </View>
    </>
  )
}
PagerTabBar = React.memo(PagerTabBar)

function PagerItem({
  isFocused,
  isScrolledDown,
  onScrollWorklet,
  renderTab,
}: {
  isFocused: boolean
  isScrolledDown: boolean
  onScrollWorklet: (e: NativeScrollEvent) => void
  renderTab: ((props: PagerWithHeaderChildParams) => JSX.Element) | null
}) {
  const scrollElRef = useAnimatedRef()
  const scrollHandler = React.useMemo(
    () => ({onScroll: onScrollWorklet}),
    [onScrollWorklet],
  )
  if (renderTab == null) {
    return null
  }
  return renderTab({
    headerHeight: 0,
    isFocused,
    isScrolledDown,
    onScroll: scrollHandler,
    scrollElRef: scrollElRef as React.MutableRefObject<
      FlatList<any> | ScrollView | null
    >,
  })
}

const styles = StyleSheet.create({
  headerContainerDesktop: {
    marginLeft: 'auto',
    marginRight: 'auto',
    width: 600,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  tabBarContainer: {
    // @ts-ignore web-only
    position: 'sticky',
    overflow: 'hidden',
    top: 0,
    zIndex: 1,
  },
  tabBarContainerDesktop: {
    marginLeft: 'auto',
    marginRight: 'auto',
    width: 600,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  tabBarContainerMobile: {
    paddingLeft: 14,
    paddingRight: 14,
  },
})

function noop() {
  'worklet'
}

function toArray<T>(v: T | T[]): T[] {
  if (Array.isArray(v)) {
    return v
  }
  return [v]
}
