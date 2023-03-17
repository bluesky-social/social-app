import React from 'react'
import {Animated, StyleSheet, View} from 'react-native'
import PagerView, {PagerViewOnPageSelectedEvent} from 'react-native-pager-view'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'
import {s} from 'lib/styles'

export type PageSelectedEvent = PagerViewOnPageSelectedEvent
const AnimatedPagerView = Animated.createAnimatedComponent(PagerView)

export interface TabBarProps {
  selectedPage: number
  position: Animated.Value
  offset: Animated.Value
  onSelect?: (index: number) => void
}

interface Props {
  tabBarPosition?: 'top' | 'bottom'
  renderTabBar: (props: TabBarProps) => JSX.Element
  onPageSelected?: (e: PageSelectedEvent) => void
}
export const Pager = ({
  children,
  tabBarPosition = 'top',
  renderTabBar,
  onPageSelected,
}: React.PropsWithChildren<Props>) => {
  const [selectedPage, setSelectedPage] = React.useState(0)
  const position = useAnimatedValue(0)
  const offset = useAnimatedValue(0)
  const pagerView = React.useRef<PagerView>()

  const onPageSelectedInner = React.useCallback(
    (e: PageSelectedEvent) => {
      setSelectedPage(e.nativeEvent.position)
      onPageSelected?.(e)
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
    <View>
      {tabBarPosition === 'top' &&
        renderTabBar({
          selectedPage,
          position,
          offset,
          onSelect: onTabBarSelect,
        })}
      <AnimatedPagerView
        ref={pagerView}
        style={s.h100pct}
        initialPage={0}
        onPageSelected={onPageSelectedInner}
        onPageScroll={Animated.event(
          [
            {
              nativeEvent: {
                position: position,
                offset: offset,
              },
            },
          ],
          {useNativeDriver: true},
        )}>
        {children}
      </AnimatedPagerView>
      {tabBarPosition === 'bottom' &&
        renderTabBar({
          selectedPage,
          position,
          offset,
          onSelect: onTabBarSelect,
        })}
    </View>
  )
}
