import {useRef} from 'react'

const AUTO_SCROLL_THRESHOLD = 50
const AUTO_SCROLL_SPEED = 8

/**
 * Web-only auto-scroll hook. While dragging near the top or bottom edge
 * of the nearest scrollable ancestor, this hook scrolls the container
 * and reports the delta so the drag state can compensate.
 */
export function useAutoScroll() {
  const rafRef = useRef(0)
  const scrollableRef = useRef<HTMLElement | null>(null)
  const activeRef = useRef(false)
  const clientYRef = useRef(0)
  const onDeltaRef = useRef<((delta: number) => void) | null>(null)

  const findScrollable = (el: HTMLElement): HTMLElement | null => {
    let node: HTMLElement | null = el.parentElement
    while (node) {
      const style = getComputedStyle(node)
      if (
        node.scrollHeight > node.clientHeight &&
        (style.overflowY === 'auto' || style.overflowY === 'scroll')
      ) {
        return node
      }
      node = node.parentElement
    }
    return null
  }

  const tick = () => {
    if (!activeRef.current || !scrollableRef.current) return

    const rect = scrollableRef.current.getBoundingClientRect()
    const y = clientYRef.current

    let delta = 0
    if (y < rect.top + AUTO_SCROLL_THRESHOLD) {
      delta = -AUTO_SCROLL_SPEED
    } else if (y > rect.bottom - AUTO_SCROLL_THRESHOLD) {
      delta = AUTO_SCROLL_SPEED
    }

    if (delta !== 0) {
      const prev = scrollableRef.current.scrollTop
      scrollableRef.current.scrollTop += delta
      const actual = scrollableRef.current.scrollTop - prev
      if (actual !== 0 && onDeltaRef.current) {
        onDeltaRef.current(actual)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
  }

  const start = (target: HTMLElement, onDelta: (delta: number) => void) => {
    scrollableRef.current = findScrollable(target)
    onDeltaRef.current = onDelta
    activeRef.current = true
    rafRef.current = requestAnimationFrame(tick)
  }

  const move = (clientY: number) => {
    clientYRef.current = clientY
  }

  const stop = () => {
    activeRef.current = false
    cancelAnimationFrame(rafRef.current)
    scrollableRef.current = null
    onDeltaRef.current = null
  }

  return {start, move, stop}
}
