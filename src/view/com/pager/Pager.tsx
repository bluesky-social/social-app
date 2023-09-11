import React, {forwardRef} from 'react'
import {Animated, View} from 'react-native'
import PagerView, {PagerViewOnPageSelectedEvent} from 'react-native-pager-view'
import {s} from 'lib/styles'

export type PageSelectedEvent = PagerViewOnPageSelectedEvent
const AnimatedPagerView = Animated.createAnimatedComponent(PagerView)

export interface PagerRef {
  setPage: (index: number) => void
}

export interface RenderTabBarFnProps {
  selectedPage: number
  onSelect?: (index: number) => void
}
export type RenderTabBarFn = (props: RenderTabBarFnProps) => JSX.Element

interface Props {
  tabBarPosition?: 'top' | 'bottom'
  initialPage?: number
  renderTabBar: RenderTabBarFn
  onPageSelected?: (index: number) => void
  testID?: string
}
export const Pager = forwardRef<PagerRef, React.PropsWithChildren<Props>>(
  function PagerImpl(
    {
      children,
      tabBarPosition = 'top',
      initialPage = 0,
      renderTabBar,
      onPageSelected,
      testID,
    }: React.PropsWithChildren<Props>,
    ref,
  ) {
    const [selectedPage, setSelectedPage] = React.useState(0)
    const pagerView = React.useRef<PagerView>(null)

    React.useImperativeHandle(ref, () => ({
      setPage: (index: number) => pagerView.current?.setPage(index),
    }))

    const onPageSelectedInner = React.useCallback(
      (e: PageSelectedEvent) => {
        setSelectedPage(e.nativeEvent.position)
        onPageSelected?.(e.nativeEvent.position)
      },
      [setSelectedPage, onPageSelected],
    )

    const onTabBarSelect = React.useCallback(
      (index: number) => {
        pagerView.current?.setPage(index)
      },
      [pagerView],
    )

    return (
      <View testID={testID}>
        {tabBarPosition === 'top' &&
          renderTabBar({
            selectedPage,
            onSelect: onTabBarSelect,
          })}
        <AnimatedPagerView
          ref={pagerView}
          style={s.h100pct}
          initialPage={initialPage}
          onPageSelected={onPageSelectedInner}>
          {children}
        </AnimatedPagerView>
        {tabBarPosition === 'bottom' &&
          renderTabBar({
            selectedPage,
            onSelect: onTabBarSelect,
          })}
      </View>
    )
  },
)
