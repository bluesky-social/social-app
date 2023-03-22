import React from 'react'
import {Animated, View} from 'react-native'
import PagerView, {PagerViewOnPageSelectedEvent} from 'react-native-pager-view'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'
import {s} from 'lib/styles'

export type PageSelectedEvent = PagerViewOnPageSelectedEvent
const AnimatedPagerView = Animated.createAnimatedComponent(PagerView)

export interface RenderTabBarFnProps {
  selectedPage: number
  position: Animated.Value
  offset: Animated.Value
  onSelect?: (index: number) => void
}
export type RenderTabBarFn = (props: RenderTabBarFnProps) => JSX.Element

interface Props {
  tabBarPosition?: 'top' | 'bottom'
  initialPage?: number
  renderTabBar: RenderTabBarFn
  onPageSelected?: (index: number) => void
}
export const Pager = ({
  children,
  tabBarPosition = 'top',
  initialPage = 0,
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
        initialPage={initialPage}
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
