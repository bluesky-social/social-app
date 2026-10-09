import {useRef} from 'react'
import {flushSync} from 'react-dom'

/**
 * Saves the outgoing page before hiding it can clamp window scroll, then
 * restores the incoming page after its content is visible.
 */
export function useScrollRestoration(
  selectPage: (page: number) => void,
  selectedPage: number,
) {
  const scrollYs = useRef(new Map<number, number>())

  return (page: number) => {
    if (page === selectedPage) {
      selectPage(page)
      return
    }

    scrollYs.current.set(selectedPage, window.scrollY)
    flushSync(() => selectPage(page))
    window.scrollTo(0, scrollYs.current.get(page) ?? 0)
  }
}
