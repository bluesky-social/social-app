import {
  Children,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import {View} from 'react-native'
import {flushSync} from 'react-dom'

import {s} from '#/lib/styles'
import {atoms as a} from '#/alf'

export interface PagerRef {
  setPage: (index: number) => void
}

export interface RenderTabBarFnProps {
  selectedPage: number
  onSelect?: (index: number) => void
  tabBarAnchor?: JSX.Element
}
export type RenderTabBarFn = (props: RenderTabBarFnProps) => JSX.Element

interface Props {
  ref?: React.Ref<PagerRef>
  initialPage?: number
  renderTabBar: RenderTabBarFn
  onPageSelected?: (index: number) => void
}

export function Pager({
  ref,
  children,
  initialPage = 0,
  renderTabBar,
  onPageSelected,
}: React.PropsWithChildren<Props>) {
  const [selectedPage, setSelectedPage] = useState(initialPage)
  const scrollYs = useRef<Array<number | null>>([])
  const anchorRef = useRef(null)

  useImperativeHandle(ref, () => ({
    setPage: (index: number) => {
      onTabBarSelect(index)
    },
  }))

  const onTabBarSelect = useCallback(
    (index: number) => {
      const scrollY = window.scrollY
      // We want to determine if the tabbar is already "sticking" at the top (in which
      // case we should preserve and restore scroll), or if it is somewhere below in the
      // viewport (in which case a scroll jump would be jarring). We determine this by
      // measuring where the "anchor" element is (which we place just above the tabbar).
      let anchorTop = anchorRef.current
        ? (anchorRef.current as Element).getBoundingClientRect().top
        : -scrollY // If there's no anchor, treat the top of the page as one.
      const isSticking = anchorTop <= 5 // This would be 0 if browser scrollTo() was reliable.

      if (isSticking) {
        scrollYs.current[selectedPage] = window.scrollY
      } else {
        scrollYs.current[selectedPage] = null
      }
      flushSync(() => {
        setSelectedPage(index)
        onPageSelected?.(index)
      })
      if (isSticking) {
        const restoredScrollY = scrollYs.current[index]
        if (restoredScrollY != null) {
          window.scrollTo(0, restoredScrollY)
        } else {
          window.scrollTo(0, scrollY + anchorTop)
        }
      }
    },
    [selectedPage, setSelectedPage, onPageSelected],
  )

  return (
    <View style={s.hContentRegion}>
      {renderTabBar({
        selectedPage,
        tabBarAnchor: <View ref={anchorRef} />,
        onSelect: e => onTabBarSelect(e),
      })}
      {Children.map(children, (child, i) => (
        <View
          style={selectedPage === i ? a.flex_1 : a.hidden}
          key={`page-${i}`}>
          {child}
        </View>
      ))}
    </View>
  )
}
