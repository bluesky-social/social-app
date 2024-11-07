import React, {forwardRef} from 'react'
import {Animated, View} from 'react-native'
import PagerView, {
  PagerViewOnPageScrollEvent,
  PagerViewOnPageSelectedEvent,
  PageScrollStateChangedNativeEvent,
} from 'react-native-pager-view'

import {LogEvents} from '#/lib/statsig/events'
import {atoms as a, native} from '#/alf'

export type PageSelectedEvent = PagerViewOnPageSelectedEvent
const AnimatedPagerView = Animated.createAnimatedComponent(PagerView)

export interface PagerRef {
  setPage: (
    index: number,
    reason: LogEvents['home:feedDisplayed']['reason'],
  ) => void
}

export interface RenderTabBarFnProps {
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

    const onPageScroll = React.useCallback(
      (e: PagerViewOnPageScrollEvent) => {
        const {position, offset} = e.nativeEvent
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
            onPageSelecting?.(position, 'pager-swipe')
            setSelectedPage(position)
            lastDirection.current = 0
          } else if (
            lastDirection.current === 1 &&
            offset > lastOffset.current
          ) {
            onPageSelecting?.(position + 1, 'pager-swipe')
            setSelectedPage(position + 1)
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
      [lastOffset, lastDirection, onPageSelecting],
    )

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
        })}
        <AnimatedPagerView
          ref={pagerView}
          style={[a.flex_1]}
          initialPage={initialPage}
          onPageScrollStateChanged={handlePageScrollStateChanged}
          onPageSelected={onPageSelectedInner}
          onPageScroll={onPageScroll}>
          {children}
        </AnimatedPagerView>
      </View>
    )
  },
)
