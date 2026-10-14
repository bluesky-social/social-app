import {
  Activity,
  Children,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import {type StyleProp, View, type ViewStyle} from 'react-native'
import {ReduceMotion, withTiming} from 'react-native-reanimated'
import {useIsFocused} from '@react-navigation/native'

import {atoms as a} from '#/alf'
import {usePagerContext} from './context'

export function Content({
  children,
  manageDrawerGesture: _manageDrawerGesture,
  scrollEnabled: _scrollEnabled,
  style,
  testID,
}: {
  children: React.ReactNode
  manageDrawerGesture?: boolean
  /**
   * Native only; there's no swiping on web.
   */
  scrollEnabled?: boolean
  style?: StyleProp<ViewStyle>
  testID?: string
}) {
  const {selectedPage, dragProgress, dragState, onPageSelected} =
    usePagerContext()
  const pages = Children.toArray(children)
  const activityName = useId()
  const previousPage = useRef(selectedPage)
  const [visitedPages, setVisitedPages] = useState(
    () => new Set([selectedPage]),
  )
  useWindowScrollPerPage(selectedPage)

  useEffect(() => {
    if (selectedPage !== previousPage.current) {
      previousPage.current = selectedPage
      dragState.set('settling')
      dragProgress.set(
        withTiming(
          selectedPage,
          {duration: 200, reduceMotion: ReduceMotion.System},
          finished => {
            'worklet'
            if (finished) dragState.set('idle')
          },
        ),
      )
      onPageSelected(selectedPage)
    }

    setVisitedPages(current => {
      if (current.has(selectedPage)) return current
      return new Set([...current, selectedPage])
    })
  }, [selectedPage, dragProgress, dragState, onPageSelected])

  return (
    <View testID={testID} style={[a.flex_1, style]}>
      {pages.map((page, pageIndex) => {
        if (!visitedPages.has(pageIndex) && selectedPage !== pageIndex) {
          return null
        }

        return (
          <Activity
            key={pageIndex}
            name={`${activityName}-${pageIndex}`}
            mode={selectedPage === pageIndex ? 'visible' : 'hidden'}>
            {page}
          </Activity>
        )
      })}
    </View>
  )
}

/**
 * Gives each page its own scroll position. The pages all scroll the window,
 * and a hidden page keeps its DOM, so switching pages swaps the content under
 * a window that stays where it was: the page would open at the offset the
 * last one was left at, cut short to its own height. Instead, the offset is
 * kept for each page as it's scrolled, and put back when the page is shown
 * again. A page shown for the first time opens at the top.
 */
export function useWindowScrollPerPage(selectedPage: number) {
  const isFocused = useIsFocused()
  const scrollYs = useRef(new Map<number, number>())
  /**
   * The page the window's offset belongs to, which changes as soon as a
   * switch commits, so the scroll that follows is kept for the page now
   * shown.
   */
  const shownPage = useRef(selectedPage)

  /*
   * Kept as the page scrolls rather than read on a switch, as by the time a
   * switch commits, the old page is hidden and the window may already have
   * been cut short to fit the new one.
   */
  useEffect(() => {
    // Other screens scroll the window too
    if (!isFocused) return
    const onScroll = () => {
      scrollYs.current.set(shownPage.current, window.scrollY)
    }
    window.addEventListener('scroll', onScroll, {passive: true})
    return () => window.removeEventListener('scroll', onScroll)
  }, [isFocused])

  // Before paint, so the new page is never seen at the old one's offset
  useLayoutEffect(() => {
    if (selectedPage === shownPage.current) return
    shownPage.current = selectedPage
    window.scrollTo({
      top: scrollYs.current.get(selectedPage) ?? 0,
      behavior: 'instant',
    })
  }, [selectedPage])
}
