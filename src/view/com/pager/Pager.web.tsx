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
  onPageSelecting?: (index: number) => void
}
export const Pager = React.forwardRef(function PagerImpl(
  {
    children,
    tabBarPosition = 'top',
    initialPage = 0,
    headerOnlyHeight = 0,
    renderTabBar,
    onPageSelected,
    onPageSelecting,
  }: React.PropsWithChildren<Props>,
  ref,
) {
  const [selectedPage, setSelectedPage] = React.useState(initialPage)
  const scrollYs = React.useRef([])

  React.useImperativeHandle(ref, () => ({
    setPage: (index: number) => setSelectedPage(index),
  }))

  const onTabBarSelect = React.useCallback(
    (index: number) => {
      const scrollY = Math.round(window.scrollY)
      scrollYs.current[selectedPage] = scrollY
      setSelectedPage(index)
      onPageSelected?.(index)
      onPageSelecting?.(index)
      if (scrollY >= headerOnlyHeight) {
        window.scrollTo(
          0,
          Math.max(headerOnlyHeight, scrollYs.current[index] ?? 0),
        )
      }
    },
    [
      selectedPage,
      setSelectedPage,
      onPageSelected,
      onPageSelecting,
      headerOnlyHeight,
    ],
  )

  return (
    <View style={s.hContentRegion}>
      {tabBarPosition === 'top' &&
        renderTabBar({
          selectedPage,
          onSelect: onTabBarSelect,
        })}
      {React.Children.map(children, (child, i) => (
        <View style={selectedPage === i ? s.flex1 : s.hidden} key={`page-${i}`}>
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
