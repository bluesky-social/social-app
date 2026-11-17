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

/**
 * Whether the view is mostly within the window, while `enabled`. Native has
 * no IntersectionObserver, so this polls the view's position, which covers
 * vertical lists, horizontal carousels, and pager pages alike. It doesn't
 * account for clipping by ancestors, so on a carousel narrower than the
 * window, e.g. on a tablet, cards just past its edge can count.
 */
export function useIsVisible(
  ref: React.RefObject<React.ComponentRef<typeof View> | null>,
  enabled: boolean,
) {
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => {
    if (!enabled) return
    const check = () => {
      const rect = ref.current?.getBoundingClientRect()
      if (!rect) return
      const window = Dimensions.get('window')
      const visibleWidth =
        Math.min(rect.right, window.width) - Math.max(rect.left, 0)
      const visibleHeight =
        Math.min(rect.bottom, window.height) - Math.max(rect.top, 0)
      setIsVisible(
        isMostlyVisible({
          visibleArea: Math.max(visibleWidth, 0) * Math.max(visibleHeight, 0),
          elementArea: rect.width * rect.height,
          viewportArea: window.width * window.height,
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
