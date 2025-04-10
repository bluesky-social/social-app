import * as React from 'react'
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import Animated, {
  AnimatedRef,
  runOnJS,
  runOnUI,
  scrollTo,
  SharedValue,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {ScrollProvider} from '#/lib/ScrollContext'
import {isIOS} from '#/platform/detection'
import {Pager, PagerRef, RenderTabBarFnProps} from '#/view/com/pager/Pager'
import {useTheme} from '#/alf'
import {ListMethods} from '../util/List'
import {PagerHeaderProvider} from './PagerHeaderContext'
import {TabBar} from './TabBar'

export interface PagerWithHeaderChildParams {
  headerHeight: number
  isFocused: boolean
  scrollElRef: React.MutableRefObject<ListMethods | ScrollView | null>
}

export interface PagerWithHeaderProps {
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
      allowHeaderOverScroll,
    }: PagerWithHeaderProps,
    ref,
  ) {
    const [currentPage, setCurrentPage] = React.useState(0)
    const [tabBarHeight, setTabBarHeight] = React.useState(0)
    const [headerOnlyHeight, setHeaderOnlyHeight] = React.useState(0)
    const scrollY = useSharedValue(0)
    const headerHeight = headerOnlyHeight + tabBarHeight

    // capture the header bar sizing
    const onTabBarLayout = useNonReactiveCallback((evt: LayoutChangeEvent) => {
      const height = evt.nativeEvent.layout.height
      if (height > 0) {
        // The rounding is necessary to prevent jumps on iOS
        setTabBarHeight(Math.round(height * 2) / 2)
      }
    })
    const onHeaderOnlyLayout = useNonReactiveCallback((height: number) => {
      if (height > 0) {
        // The rounding is necessary to prevent jumps on iOS
        setHeaderOnlyHeight(Math.round(height * 2) / 2)
      }
    })

    const renderTabBar = React.useCallback(
      (props: RenderTabBarFnProps) => {
        return (
          <PagerHeaderProvider
            scrollY={scrollY}
            headerHeight={headerOnlyHeight}>
            <PagerTabBar
              headerOnlyHeight={headerOnlyHeight}
              items={items}
              isHeaderReady={isHeaderReady}
              renderHeader={renderHeader}
              currentPage={currentPage}
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
      ],
    )

    const scrollRefs = useSharedValue<Array<AnimatedRef<any> | null>>([])
    const registerRef = React.useCallback(
      (scrollRef: AnimatedRef<any> | null, atIndex: number) => {
        scrollRefs.modify(refs => {
          'worklet'
          refs[atIndex] = scrollRef
          return refs
        })
      },
      [scrollRefs],
    )

    const lastForcedScrollY = useSharedValue(0)
    const adjustScrollForOtherPages = () => {
      'worklet'
      const currentScrollY = scrollY.get()
      const forcedScrollY = Math.min(currentScrollY, headerOnlyHeight)
      if (lastForcedScrollY.get() !== forcedScrollY) {
        lastForcedScrollY.set(forcedScrollY)
        const refs = scrollRefs.get()
        for (let i = 0; i < refs.length; i++) {
          const scollRef = refs[i]
          if (i !== currentPage && scollRef != null) {
            scrollTo(scollRef, 0, forcedScrollY, false)
          }
        }
      }
    }

    const throttleTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(
      null,
    )
    const queueThrottledOnScroll = useNonReactiveCallback(() => {
      if (!throttleTimeout.current) {
        throttleTimeout.current = setTimeout(() => {
          throttleTimeout.current = null
          runOnUI(adjustScrollForOtherPages)()
        }, 80 /* Sync often enough you're unlikely to catch it unsynced */)
      }
    })

    const onScrollWorklet = React.useCallback(
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
          runOnJS(queueThrottledOnScroll)()
        }
      },
      [scrollY, queueThrottledOnScroll, headerHeight],
    )

    const onPageSelectedInner = React.useCallback(
      (index: number) => {
        setCurrentPage(index)
        onPageSelected?.(index)
      },
      [onPageSelected, setCurrentPage],
    )

    return (
      <Pager
        ref={ref}
        testID={testID}
        initialPage={initialPage}
        onPageSelected={onPageSelectedInner}
        renderTabBar={renderTabBar}>
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
  },
)

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
  dragProgress: SharedValue<number>
  dragState: SharedValue<'idle' | 'dragging' | 'settling'>
}): React.ReactNode => {
  const t = useTheme()
  const [minimumHeaderHeight, setMinimumHeaderHeight] = React.useState(0)
  const headerTransform = useAnimatedStyle(() => {
    const translateY =
      Math.min(
        scrollY.get(),
        Math.max(headerOnlyHeight - minimumHeaderHeight, 0),
      ) * -1
    return {
      transform: [
        {
          translateY: allowHeaderOverScroll
            ? translateY
            : Math.min(translateY, 0),
        },
      ],
    }
  })
  const headerRef = React.useRef(null)
  return (
    <Animated.View
      pointerEvents={isIOS ? 'auto' : 'box-none'}
      style={[styles.tabBarMobile, headerTransform, t.atoms.bg]}>
      <View
        ref={headerRef}
        pointerEvents={isIOS ? 'auto' : 'box-none'}
        collapsable={false}>
        {renderHeader?.({setMinimumHeight: setMinimumHeaderHeight})}
        {
          // It wouldn't be enough to place `onLayout` on the parent node because
          // this would risk measuring before `isHeaderReady` has turned `true`.
          // Instead, we'll render a brand node conditionally and get fresh layout.
          isHeaderReady && (
            <View
              // It wouldn't be enough to do this in a `ref` of an effect because,
              // even if `isHeaderReady` might have turned `true`, the associated
              // layout might not have been performed yet on the native side.
              onLayout={() => {
                // @ts-ignore
                headerRef.current?.measure(
                  (_x: number, _y: number, _width: number, height: number) => {
                    onHeaderOnlyLayout(height)
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
PagerTabBar = React.memo(PagerTabBar)

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

  React.useEffect(() => {
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
          ListMethods | ScrollView | null
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
