import React, {forwardRef} from 'react'
import {View} from 'react-native'
import PagerView, {
  PagerViewOnPageSelectedEvent,
  PageScrollStateChangedNativeEvent,
} from 'react-native-pager-view'
import Animated, {
  runOnJS,
  SharedValue,
  useEvent,
  useHandler,
  useSharedValue,
} from 'react-native-reanimated'

import {LogEvents} from '#/lib/statsig/events'
import {atoms as a, native} from '#/alf'

export type PageSelectedEvent = PagerViewOnPageSelectedEvent

export interface PagerRef {
  setPage: (
    index: number,
    reason: LogEvents['home:feedDisplayed']['reason'],
  ) => void
}

export interface RenderTabBarFnProps {
  pageOffset: SharedValue<number>
  selectedPage: number
  onSelect?: (index: number) => void
  tabBarAnchor?: JSX.Element | null | undefined // Ignored on native.
}
export type RenderTabBarFn = (props: RenderTabBarFnProps) => JSX.Element

interface Props {
  initialPage?: number
  renderTabBar: RenderTabBarFn
  onPageSelected?: (index: number) => void
  onPageSelecting?: (
    index: number,
    reason: LogEvents['home:feedDisplayed']['reason'],
  ) => void
  onPageScrollStateChanged?: (
    scrollState: 'idle' | 'dragging' | 'settling',
  ) => void
  testID?: string
}

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView)

export const Pager = forwardRef<PagerRef, React.PropsWithChildren<Props>>(
  function PagerImpl(
    {
      children,
      initialPage = 0,
      renderTabBar,
      onPageScrollStateChanged,
      onPageSelected,
      onPageSelecting,
      testID,
    }: React.PropsWithChildren<Props>,
    ref,
  ) {
    const [selectedPage, setSelectedPage] = React.useState(0)
    const lastOffset = React.useRef(0)
    const lastDirection = React.useRef(0)
    const scrollState = React.useRef('')
    const pagerView = React.useRef<PagerView>(null)
    const pageOffset = useSharedValue(0)

    React.useImperativeHandle(ref, () => ({
      setPage: (
        index: number,
        reason: LogEvents['home:feedDisplayed']['reason'],
      ) => {
        pagerView.current?.setPage(index)
        onPageSelecting?.(index, reason)
      },
    }))

    const onPageSelectedInner = React.useCallback(
      (e: PageSelectedEvent) => {
        setSelectedPage(e.nativeEvent.position)
        onPageSelected?.(e.nativeEvent.position)
      },
      [setSelectedPage, onPageSelected],
    )

    const scrollHandler = usePagerScrollHandler({
      onPageScroll: (e: any) => {
        'worklet'
        const {offset, position} = e
        pageOffset.value = offset + position
        console.log(e.offset, e.position)

        if (offset === 0) {
          // offset hits 0 in some awkward spots so we ignore it
          return
        }
        // NOTE
        // we want to call `onPageSelecting` as soon as the scroll-gesture
        // enters the "settling" phase, which means the user has released it
        // we can't infer directionality from the scroll information, so we
        // track the offset changes. if the offset delta is consistent with
        // the existing direction during the settling phase, we can say for
        // certain where it's going and can fire
        // -prf
        if (scrollState.current === 'settling') {
          if (lastDirection.current === -1 && offset < lastOffset.current) {
            if (onPageSelecting) {
              runOnJS(onPageSelecting)(position, 'pager-swipe')
            }
            runOnJS(setSelectedPage)(position)
            lastDirection.current = 0
          } else if (
            lastDirection.current === 1 &&
            offset > lastOffset.current
          ) {
            if (onPageSelecting) {
              runOnJS(onPageSelecting)(position + 1, 'pager-swipe')
            }
            runOnJS(setSelectedPage)(position + 1)
            lastDirection.current = 0
          }
        } else {
          if (offset < lastOffset.current) {
            lastDirection.current = -1
          } else if (offset > lastOffset.current) {
            lastDirection.current = 1
          }
        }
        lastOffset.current = offset
      },
    })

    const handlePageScrollStateChanged = React.useCallback(
      (e: PageScrollStateChangedNativeEvent) => {
        scrollState.current = e.nativeEvent.pageScrollState
        onPageScrollStateChanged?.(e.nativeEvent.pageScrollState)
      },
      [scrollState, onPageScrollStateChanged],
    )

    const onTabBarSelect = React.useCallback(
      (index: number) => {
        pagerView.current?.setPage(index)
        onPageSelecting?.(index, 'tabbar-click')
      },
      [pagerView, onPageSelecting],
    )

    return (
      <View testID={testID} style={[a.flex_1, native(a.overflow_hidden)]}>
        {renderTabBar({
          selectedPage,
          onSelect: onTabBarSelect,
          pageOffset,
        })}
        <AnimatedPagerView
          ref={pagerView}
          style={[a.flex_1]}
          initialPage={initialPage}
          onPageScrollStateChanged={handlePageScrollStateChanged}
          onPageSelected={onPageSelectedInner}
          onPageScroll={scrollHandler}>
          {children}
        </AnimatedPagerView>
      </View>
    )
  },
)

// taken from official pager-view reanimated example https://github.com/callstack/react-native-pager-view/blob/master/example/src/ReanimatedOnPageScrollExample.tsx
function usePagerScrollHandler(handlers: any, dependencies?: any) {
  const {context, doDependenciesDiffer} = useHandler(handlers, dependencies)
  const subscribeForEvents = ['onPageScroll']

  return useEvent<any>(
    event => {
      'worklet'
      const {onPageScroll} = handlers
      if (onPageScroll && event.eventName.endsWith('onPageScroll')) {
        onPageScroll(event, context)
      }
    },
    subscribeForEvents,
    doDependenciesDiffer,
  )
}
