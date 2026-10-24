import {type JSX, memo, useCallback, useEffect, useRef, useState} from 'react'
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import Animated, {
  type AnimatedRef,
  scrollTo,
  type SharedValue,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated'
import {scheduleOnUI} from 'react-native-worklets'

import {ScrollProvider} from '#/lib/ScrollContext'
import {
  Pager,
  type PagerRef,
  type RenderTabBarFnProps,
} from '#/view/com/pager/Pager'
import {useTheme} from '#/alf'
import {Center} from '#/components/Layout'
import {IS_IOS} from '#/env'
import {type ListMethods} from '../util/List'
import {PagerHeaderProvider} from './PagerHeaderContext'
import {TabBar} from './TabBar'

export interface PagerWithHeaderChildParams {
  headerHeight: number
  isFocused: boolean
  scrollElRef: React.MutableRefObject<
    ListMethods | React.ComponentRef<typeof ScrollView> | null
  >
}

export interface PagerWithHeaderProps {
  ref?: React.Ref<PagerRef>
  testID?: string
  children:
    | (((props: PagerWithHeaderChildParams) => JSX.Element) | null)[]
    | ((props: PagerWithHeaderChildParams) => JSX.Element)
  items: string[]
  isHeaderReady: boolean
  renderHeader?: ({
    setMinimumHeight,
  }: {
    setMinimumHeight: (height: number) => void
  }) => JSX.Element
  initialPage?: number
  onPageSelected?: (index: number) => void
  onCurrentPageSelected?: (index: number) => void
  allowHeaderOverScroll?: boolean
  /** Extra vertical clipping bounds for a header that must clip horizontally. */
  headerOverflowInset?: number
  /**
   * The header's own height, for headers that can measure themselves.
   *
   * Measuring the wrapper around the header is unreliable when the header is
   * wrapped in a native view that reports its own size, and every point it is
   * over-measured is a point of blank space above the first row and a strip
   * that comes to rest in the wrong place. A header that knows its own height
   * should say so.
   */
  headerContentHeight?: number
}
export function PagerWithHeader({
  ref,
  children,
  testID,
  items,
  isHeaderReady,
  renderHeader,
  initialPage,
  onPageSelected,
  onCurrentPageSelected,
  allowHeaderOverScroll,
  headerOverflowInset,
  headerContentHeight,
}: PagerWithHeaderProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [tabBarHeight, setTabBarHeight] = useState(0)
  const [measuredHeaderOnlyHeight, setHeaderOnlyHeight] = useState(0)
  const headerOnlyHeight = headerContentHeight ?? measuredHeaderOnlyHeight
  const scrollY = useSharedValue(0)
  const headerHeight = headerOnlyHeight + tabBarHeight

  // capture the header bar sizing
  const onTabBarLayout = useCallback((evt: LayoutChangeEvent) => {
    const height = evt.nativeEvent.layout.height
    if (height > 0) {
      // The rounding is necessary to prevent jumps on iOS
      setTabBarHeight(Math.round(height * 2) / 2)
    }
  }, [])
  const onHeaderOnlyLayout = useCallback((height: number) => {
    if (height > 0) {
      // The rounding is necessary to prevent jumps on iOS
      setHeaderOnlyHeight(Math.round(height * 2) / 2)
    }
  }, [])

  const renderTabBar = useCallback(
    (props: RenderTabBarFnProps) => {
      return (
        <PagerHeaderProvider scrollY={scrollY} headerHeight={headerOnlyHeight}>
          <PagerTabBar
            headerOnlyHeight={headerOnlyHeight}
            items={items}
            isHeaderReady={isHeaderReady}
            renderHeader={renderHeader}
            currentPage={currentPage}
            headerOverflowInset={headerOverflowInset}
            onCurrentPageSelected={onCurrentPageSelected}
            onTabBarLayout={onTabBarLayout}
            onHeaderOnlyLayout={onHeaderOnlyLayout}
            onSelect={props.onSelect}
            scrollY={scrollY}
            testID={testID}
            allowHeaderOverScroll={allowHeaderOverScroll}
            dragProgress={props.dragProgress}
            dragState={props.dragState}
          />
        </PagerHeaderProvider>
      )
    },
    [
      headerOnlyHeight,
      items,
      isHeaderReady,
      renderHeader,
      currentPage,
      onCurrentPageSelected,
      onTabBarLayout,
      onHeaderOnlyLayout,
      scrollY,
      testID,
      allowHeaderOverScroll,
      headerOverflowInset,
    ],
  )

  const scrollRefs = useSharedValue<Array<AnimatedRef<any> | null>>([])
  const registerRef = useCallback(
    (scrollRef: AnimatedRef<any> | null, atIndex: number) => {
      scrollRefs.modify(refs => {
        'worklet'
        refs[atIndex] = scrollRef
        return refs
      })
    },
    [scrollRefs],
  )

  const isSyncingPages = useSharedValue(false)
  /**
   * Where the page being left is scrolled to, clamped so that a page with
   * nothing below the fold does not try to go past its own end.
   */
  const syncTarget = useCallback(() => {
    'worklet'
    return Math.min(scrollY.get(), headerOnlyHeight)
  }, [scrollY, headerOnlyHeight])

  /**
   * Put the pages either side of this one where this one is.
   *
   * The header is drawn above the pages rather than inside them, so pages at
   * different offsets would show the header in two places mid-swipe and leave
   * the reader at the top of the tab they swiped to. This runs once at the
   * start of a drag, against the two pages a swipe can reach, and they then
   * agree for the rest of the gesture. It used to run on every frame of the
   * drag, against every page.
   */
  const alignNeighbouringPages = useCallback(
    (scrollState: 'idle' | 'dragging' | 'settling') => {
      'worklet'
      if (scrollState !== 'dragging') {
        isSyncingPages.set(false)
        return
      }
      if (isSyncingPages.get()) return
      isSyncingPages.set(true)
      const target = syncTarget()
      const refs = scrollRefs.get()
      for (const i of [currentPage - 1, currentPage + 1]) {
        const scrollRef = refs[i]
        if (i >= 0 && scrollRef != null) {
          scrollTo(scrollRef, 0, target, false)
        }
      }
    },
    [
      currentPage,
      headerOnlyHeight,
      isSyncingPages,
      scrollRefs,
      scrollY,
      syncTarget,
    ],
  )

  /**
   * Pressing a tab jumps rather than swipes, so every page - including the one
   * being jumped to - takes the offset of the page being left behind.
   */
  const alignAllPages = useCallback(() => {
    'worklet'
    const target = syncTarget()
    const refs = scrollRefs.get()
    for (let i = 0; i < refs.length; i++) {
      const scrollRef = refs[i]
      if (i !== currentPage && scrollRef != null) {
        scrollTo(scrollRef, 0, target, false)
      }
    }
  }, [currentPage, scrollRefs, syncTarget])

  const onScrollWorklet = useCallback(
    (e: NativeScrollEvent) => {
      'worklet'
      const nextScrollY = e.contentOffset.y
      // HACK: onScroll is reporting some strange values on load (negative header height).
      // Highly improbable that you'd be overscrolled by over 400px -
      // in fact, I actually can't do it, so let's just ignore those. -sfn
      const isPossiblyInvalid =
        headerHeight > 0 && Math.round(nextScrollY * 2) / 2 === -headerHeight
      if (!isPossiblyInvalid) {
        scrollY.set(nextScrollY)
      }
    },
    [scrollY, headerHeight],
  )

  const onPageSelectedInner = useCallback(
    (index: number) => {
      setCurrentPage(index)
      onPageSelected?.(index)
    },
    [onPageSelected, setCurrentPage],
  )

  const onTabPressed = useCallback(() => {
    scheduleOnUI(alignAllPages)
  }, [alignAllPages])

  return (
    <Pager
      ref={ref}
      testID={testID}
      initialPage={initialPage}
      onTabPressed={onTabPressed}
      onPageSelected={onPageSelectedInner}
      renderTabBar={renderTabBar}
      onPageScrollStateChanged={alignNeighbouringPages}>
      {toArray(children)
        .filter(Boolean)
        .map((child, i) => {
          const isReady =
            isHeaderReady && headerOnlyHeight > 0 && tabBarHeight > 0
          return (
            <View key={i} collapsable={false}>
              <PagerItem
                headerHeight={headerHeight}
                index={i}
                isReady={isReady}
                isFocused={i === currentPage}
                onScrollWorklet={i === currentPage ? onScrollWorklet : noop}
                registerRef={registerRef}
                renderTab={child}
              />
            </View>
          )
        })}
    </Pager>
  )
}

let PagerTabBar = ({
  currentPage,
  headerOnlyHeight,
  isHeaderReady,
  items,
  scrollY,
  testID,
  renderHeader,
  onHeaderOnlyLayout,
  onTabBarLayout,
  onCurrentPageSelected,
  onSelect,
  allowHeaderOverScroll,
  headerOverflowInset,
  dragProgress,
  dragState,
}: {
  currentPage: number
  headerOnlyHeight: number
  isHeaderReady: boolean
  items: string[]
  testID?: string
  scrollY: SharedValue<number>
  renderHeader?: ({
    setMinimumHeight,
  }: {
    setMinimumHeight: (height: number) => void
  }) => JSX.Element
  onHeaderOnlyLayout: (height: number) => void
  onTabBarLayout: (e: LayoutChangeEvent) => void
  onCurrentPageSelected?: (index: number) => void
  onSelect?: (index: number) => void
  allowHeaderOverScroll?: boolean
  /** Extra vertical clipping bounds for a header that must clip horizontally. */
  headerOverflowInset?: number
  dragProgress: SharedValue<number>
  dragState: SharedValue<'idle' | 'dragging' | 'settling'>
}): React.ReactNode => {
  const t = useTheme()
  const [minimumHeaderHeight, setMinimumHeaderHeight] = useState(0)
  /*
   * Reanimated compares `transform` arrays by reference, so an animated style
   * computing the transform straight from scrollY commits on every scroll
   * frame, even once the header is pinned. A derived value only notifies the
   * style when the offset changes, so it commits only while the header moves.
   */
  const headerTranslateY = useDerivedValue(() => {
    const translateY =
      Math.min(
        scrollY.get(),
        Math.max(headerOnlyHeight - minimumHeaderHeight, 0),
      ) * -1
    return allowHeaderOverScroll ? translateY : Math.min(translateY, 0)
  })
  const headerTransform = useAnimatedStyle(() => ({
    transform: [{translateY: headerTranslateY.get()}],
  }))
  const headerRef = useRef<React.ComponentRef<typeof View>>(null)
  const fallbackHeaderOnlyHeight = useRef(0)
  return (
    <Animated.View
      pointerEvents={IS_IOS ? 'auto' : 'box-none'}
      style={[styles.tabBarMobile, headerTransform, t.atoms.bg]}>
      <View
        ref={headerRef}
        pointerEvents={IS_IOS ? 'auto' : 'box-none'}
        collapsable={false}
        onLayout={(e: LayoutChangeEvent) => {
          // Fallback measurement using onLayout directly on the header wrapper.
          // This is more reliable than .measure() on Android after certain
          // navigation transitions (e.g. returning from the logged-out view)
          // where .measure() can fail to return a height. in general though,
          // we should prefer using .measure() when possible as this can
          // fire too early and cause layout thrashing.
          // ref: https://github.com/bluesky-social/social-app/pull/9964 -sfp
          if (isHeaderReady) {
            fallbackHeaderOnlyHeight.current = e.nativeEvent.layout.height
          }
        }}>
        {/*
         * Center always forms a native view (its translateX transform keeps it
         * from being flattened), so it must be box-none: on Android, swipes on
         * the header only scroll the list if they fall through to it. The
         * extended clipping bounds must not intercept touches over the feed
         * either.
         */}
        <Center
          pointerEvents="box-none"
          style={
            headerOverflowInset != null && {
              overflow: 'hidden',
              marginVertical: -headerOverflowInset,
              paddingVertical: headerOverflowInset,
            }
          }>
          {renderHeader?.({setMinimumHeight: setMinimumHeaderHeight})}
        </Center>
        {
          // It wouldn't be enough to place `onLayout` on the parent node because
          // this would risk measuring before `isHeaderReady` has turned `true`.
          // Instead, we'll render a brand node conditionally and get fresh layout.
          isHeaderReady && (
            <View
              collapsable={false}
              // It wouldn't be enough to do this in a `ref` of an effect because,
              // even if `isHeaderReady` might have turned `true`, the associated
              // layout might not have been performed yet on the native side.
              onLayout={() => {
                headerRef.current?.measure(
                  (_x: number, _y: number, _width: number, height: number) => {
                    // sometimes height is `undefined` on Android, see above
                    if (height !== undefined) {
                      onHeaderOnlyLayout(height)
                    } else {
                      // if measure fails, use the value we got from `onLayout`
                      onHeaderOnlyLayout(fallbackHeaderOnlyHeight.current)
                    }
                  },
                )
              }}
            />
          )
        }
      </View>
      <View
        onLayout={onTabBarLayout}
        style={{
          // Render it immediately to measure it early since its size doesn't depend on the content.
          // However, keep it invisible until the header above stabilizes in order to prevent jumps.
          opacity: isHeaderReady ? 1 : 0,
          pointerEvents: isHeaderReady ? 'auto' : 'none',
        }}>
        <TabBar
          testID={testID}
          items={items}
          selectedPage={currentPage}
          onSelect={onSelect}
          onPressSelected={onCurrentPageSelected}
          dragProgress={dragProgress}
          dragState={dragState}
        />
      </View>
    </Animated.View>
  )
}
PagerTabBar = memo(PagerTabBar)

function PagerItem({
  headerHeight,
  index,
  isReady,
  isFocused,
  onScrollWorklet,
  renderTab,
  registerRef,
}: {
  headerHeight: number
  index: number
  isFocused: boolean
  isReady: boolean
  registerRef: (scrollRef: AnimatedRef<any> | null, atIndex: number) => void
  onScrollWorklet: (e: NativeScrollEvent) => void
  renderTab: ((props: PagerWithHeaderChildParams) => JSX.Element) | null
}) {
  const scrollElRef = useAnimatedRef()

  useEffect(() => {
    registerRef(scrollElRef, index)
    return () => {
      registerRef(null, index)
    }
  }, [scrollElRef, registerRef, index])

  if (!isReady || renderTab == null) {
    return null
  }

  return (
    <ScrollProvider onScroll={onScrollWorklet}>
      {renderTab({
        headerHeight,
        isFocused,
        scrollElRef: scrollElRef as React.MutableRefObject<
          ListMethods | React.ComponentRef<typeof ScrollView> | null
        >,
      })}
    </ScrollProvider>
  )
}

const styles = StyleSheet.create({
  tabBarMobile: {
    position: 'absolute',
    zIndex: 1,
    top: 0,
    left: 0,
    width: '100%',
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
