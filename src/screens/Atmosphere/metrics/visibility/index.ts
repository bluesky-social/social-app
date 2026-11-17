import {useEffect, useState} from 'react'
import {Dimensions, type View} from 'react-native'

import {isMostlyVisible} from './shared'

const CHECK_INTERVAL_MS = 250

const checks = new Set<() => void>()
let interval: ReturnType<typeof setInterval> | undefined

/** Runs every check on one shared timer, which only runs while there are any. */
function addCheck(check: () => void) {
  checks.add(check)
  interval ??= setInterval(() => {
    for (const each of checks) each()
  }, CHECK_INTERVAL_MS)
  return () => {
    checks.delete(check)
    if (checks.size === 0) {
      clearInterval(interval)
      interval = undefined
    }
  }
}

type Box = {left: number; top: number; right: number; bottom: number}

/** The parts of a native host element read here, from RN's DOM APIs. */
type HostElement = {
  getBoundingClientRect(): Box
  parentElement: HostElement | null
  tagName: string
}

function intersect(a: Box, b: Box): Box {
  return {
    left: Math.max(a.left, b.left),
    top: Math.max(a.top, b.top),
    right: Math.min(a.right, b.right),
    bottom: Math.min(a.bottom, b.bottom),
  }
}

function area({left, top, right, bottom}: Box) {
  return Math.max(right - left, 0) * Math.max(bottom - top, 0)
}

/**
 * The scroll views around a node, which clip what of it is visible: lists,
 * and carousels narrower than the window, e.g. on tablets. Vertical and
 * horizontal scroll views on both platforms report `RN:ScrollView`.
 */
function getScrollAncestors(node: HostElement) {
  const ancestors: HostElement[] = []
  for (let el = node.parentElement; el; el = el.parentElement) {
    if (/ScrollView$/.test(el.tagName)) ancestors.push(el)
  }
  return ancestors
}

/**
 * Whether the view is mostly visible, while `enabled`: in the window and
 * within every scroll view around it. Native has no IntersectionObserver, so
 * this polls the view's position, which covers vertical lists, horizontal
 * carousels, and pager pages alike. The viewport, for views bigger than it,
 * is the area those scroll views leave visible.
 */
export function useIsVisible(
  ref: React.RefObject<React.ComponentRef<typeof View> | null>,
  enabled: boolean,
) {
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => {
    if (!enabled) return
    let scrollAncestors: HostElement[] | undefined
    const check = () => {
      const node = ref.current as unknown as HostElement | null
      if (!node) return
      // A view stays in the same scroll views while mounted
      scrollAncestors ??= getScrollAncestors(node)
      const window = Dimensions.get('window')
      const viewport = scrollAncestors.reduce<Box>(
        (box, ancestor) => intersect(box, ancestor.getBoundingClientRect()),
        {left: 0, top: 0, right: window.width, bottom: window.height},
      )
      const rect = node.getBoundingClientRect()
      setIsVisible(
        isMostlyVisible({
          visibleArea: area(intersect(rect, viewport)),
          elementArea: area(rect),
          viewportArea: area(viewport),
        }),
      )
    }
    check()
    const removeCheck = addCheck(check)
    return () => {
      removeCheck()
      setIsVisible(false)
    }
  }, [enabled, ref])
  return enabled && isVisible
}
