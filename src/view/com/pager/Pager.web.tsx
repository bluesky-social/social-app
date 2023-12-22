import React from 'react'
import {flushSync} from 'react-dom'
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
    renderTabBar,
    onPageSelected,
    onPageSelecting,
  }: React.PropsWithChildren<Props>,
  ref,
) {
  const [selectedPage, setSelectedPage] = React.useState(initialPage)
  const scrollYs = React.useRef([])
  const anchorRef = React.useRef(null)

  React.useImperativeHandle(ref, () => ({
    setPage: (index: number) => setSelectedPage(index),
  }))

  const onTabBarSelect = React.useCallback(
    (index: number) => {
      const scrollY = window.scrollY
      let anchorTop = anchorRef.current
        ? anchorRef.current.getBoundingClientRect().top
        : -scrollY
      const isSticking = anchorTop <= 5
      if (isSticking) {
        scrollYs.current[selectedPage] = window.scrollY
      } else {
        scrollYs.current[selectedPage] = null
      }
      flushSync(() => {
        setSelectedPage(index)
        onPageSelected?.(index)
        onPageSelecting?.(index)
      })
      if (isSticking) {
        if (scrollYs.current[index]) {
          window.scrollTo(0, scrollYs.current[index])
        } else {
          window.scrollTo(0, scrollY + anchorTop)
        }
      }
    },
    [selectedPage, setSelectedPage, onPageSelected, onPageSelecting],
  )

  return (
    <View style={s.hContentRegion}>
      {tabBarPosition === 'top' &&
        renderTabBar({
          selectedPage,
          tabBarAnchor: <View ref={anchorRef} />,
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
