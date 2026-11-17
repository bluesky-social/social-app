import {useEffect, useState} from 'react'
import {type View} from 'react-native'

import {isMostlyVisible} from './shared'

/** Fine enough to notice half the viewport covered by a tall element. */
const THRESHOLDS = Array.from({length: 21}, (_, i) => i / 20)

/**
 * Whether the view is mostly within the viewport, while `enabled`. Hidden
 * views, e.g. on a pager page not in view, and parts clipped by a carousel
 * don't count.
 */
export function useIsVisible(
  ref: React.RefObject<React.ComponentRef<typeof View> | null>,
  enabled: boolean,
) {
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => {
    const node = ref.current as unknown as Element | null
    if (!enabled || !node) return
    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[entries.length - 1]
        const {intersectionRect, boundingClientRect, rootBounds} = entry
        setIsVisible(
          entry.isIntersecting &&
            isMostlyVisible({
              visibleArea: intersectionRect.width * intersectionRect.height,
              elementArea: boundingClientRect.width * boundingClientRect.height,
              viewportArea: rootBounds
                ? rootBounds.width * rootBounds.height
                : Infinity,
            }),
        )
      },
      {threshold: THRESHOLDS},
    )
    observer.observe(node)
    return () => {
      observer.disconnect()
      setIsVisible(false)
    }
  }, [enabled, ref])
  return enabled && isVisible
}
