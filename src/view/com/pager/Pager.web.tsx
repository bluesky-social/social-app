import {
  Children,
  type JSX,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import {View} from 'react-native'
import {type SharedValue, useSharedValue} from 'react-native-reanimated'
import {flushSync} from 'react-dom'

import {s} from '#/lib/styles'
import {atoms as a} from '#/alf'

export interface PagerRef {
  setPage: (index: number) => void
}

export interface RenderTabBarFnProps {
  selectedPage: number
  onSelect?: (index: number) => void
  tabBarAnchor?: JSX.Element | null | undefined // Ignored on native.
  dragProgress: SharedValue<number> // Ignored on web.
  dragState: SharedValue<'idle' | 'dragging' | 'settling'> // Ignored on web.
}
export type RenderTabBarFn = (props: RenderTabBarFnProps) => JSX.Element

interface Props {
  ref?: React.Ref<PagerRef>
  initialPage?: number
  renderTabBar: RenderTabBarFn
  // tab pressed, yet to scroll to page
  onTabPressed?: (index: number) => void
  // scroll settled
  onPageSelected?: (index: number) => void
  /**
   * Never fires on web - pages switch instantly, there is no drag gesture.
   */
  onPageScrollStateChanged?: (
    scrollState: 'idle' | 'dragging' | 'settling',
  ) => void
  testID?: string
}

export function Pager({
  ref,
  children,
  initialPage = 0,
  renderTabBar,
  onTabPressed,
  onPageSelected,
  onPageScrollStateChanged: _onPageScrollStateChanged,
  testID,
}: React.PropsWithChildren<Props>) {
  const [selectedPage, setSelectedPage] = useState(initialPage)
  const scrollYs = useRef<Array<number | null>>([])
  const anchorRef = useRef(null)

  /*
   * There is no drag gesture on web; these exist to satisfy the shared
   * RenderTabBarFnProps contract and never change.
   */
  const dragProgress = useSharedValue(selectedPage)
  const dragState = useSharedValue<'idle' | 'dragging' | 'settling'>('idle')

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

      onTabPressed?.(index)
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
    [selectedPage, setSelectedPage, onPageSelected, onTabPressed],
  )

  return (
    <View testID={testID} style={s.hContentRegion}>
      {renderTabBar({
        selectedPage,
        tabBarAnchor: <View ref={anchorRef} />,
        onSelect: e => onTabBarSelect(e),
        dragProgress,
        dragState,
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
