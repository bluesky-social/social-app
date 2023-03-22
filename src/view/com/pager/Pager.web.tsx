import React from 'react'
import {Animated, View} from 'react-native'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'
import {s} from 'lib/styles'

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
  const [selectedPage, setSelectedPage] = React.useState(initialPage)
  const position = useAnimatedValue(0)
  const offset = useAnimatedValue(0)

  const onTabBarSelect = React.useCallback(
    (index: number) => {
      setSelectedPage(index)
      onPageSelected?.(index)
      Animated.timing(position, {
        toValue: index,
        duration: 200,
        useNativeDriver: true,
      }).start()
    },
    [setSelectedPage, onPageSelected, position],
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
      {React.Children.map(children, (child, i) => (
        <View
          style={selectedPage === i ? undefined : s.hidden}
          key={`page-${i}`}>
          {child}
        </View>
      ))}
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
