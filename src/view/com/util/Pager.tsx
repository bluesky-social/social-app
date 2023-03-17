import React from 'react'
import {Animated, StyleSheet, View} from 'react-native'
import PagerView, {PagerViewOnPageSelectedEvent} from 'react-native-pager-view'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'
import {TabBar} from './TabBar'

export type PageSelectedEvent = PagerViewOnPageSelectedEvent
const AnimatedPagerView = Animated.createAnimatedComponent(PagerView)

interface Props {
  onPageSelected?: (e: PageSelectedEvent) => void
}
export const Pager = ({
  children,
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
      <TabBar
        position={position}
        offset={offset}
        items={['One', 'Two', 'Three']}
        selectedPage={selectedPage}
        onSelect={onTabBarSelect}
      />
      <AnimatedPagerView
        ref={pagerView}
        style={{height: '100%'}}
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
          {useNativeDriver: false},
        )}>
        {children}
      </AnimatedPagerView>
    </View>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
  },
})
