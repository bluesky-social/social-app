import React from 'react'
import {View} from 'react-native'
import {s} from 'lib/styles'

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
}
export const Pager = React.forwardRef(function PagerImpl(
  {
    children,
    tabBarPosition = 'top',
    initialPage = 0,
    renderTabBar,
    onPageSelected,
  }: React.PropsWithChildren<Props>,
  ref,
) {
  const [selectedPage, setSelectedPage] = React.useState(initialPage)

  React.useImperativeHandle(ref, () => ({
    setPage: (index: number) => setSelectedPage(index),
  }))

  const onTabBarSelect = React.useCallback(
    (index: number) => {
      setSelectedPage(index)
      onPageSelected?.(index)
    },
    [setSelectedPage, onPageSelected],
  )

  return (
    <View>
      {tabBarPosition === 'top' &&
        renderTabBar({
          selectedPage,
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
          onSelect: onTabBarSelect,
        })}
    </View>
  )
})
