import {useEffect} from 'react'

import {isEditableTarget} from '#/components/Gallery/domUtils'
import {tween} from '#/components/Gallery/tween'
import {type NavigationHandlerArgs} from '#/components/Gallery/types'
import {getOffsetForIndex} from '#/components/Gallery/utils'

const SETTLE_DURATION = 700

export function useKeyboardHandlers({
  scrollRef,
  itemWidthsRef,
  currentIndexRef,
  scrollTo,
  onSettle,
  itemCount,
  resetKey,
}: NavigationHandlerArgs) {
  useEffect(() => {
    if (itemCount <= 1) return

    let stopTween: (() => void) | null = null
    let pendingIndex: number | null = null

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
      const el = scrollRef.current?.getScrollableNode() as HTMLElement | null
      if (!el || !el.contains(document.activeElement)) return
      // Text fields, selects and sliders use the arrow keys themselves
      if (
        isEditableTarget(e.target) ||
        isEditableTarget(document.activeElement)
      )
        return

      const current = pendingIndex ?? currentIndexRef.current
      let targetIndex: number | undefined

      if (e.key === 'ArrowRight') {
        if (current < itemCount - 1) {
          targetIndex = current + 1
        }
      } else if (e.key === 'ArrowLeft') {
        if (current > 0) {
          targetIndex = current - 1
        }
      }

      if (targetIndex != null) {
        e.preventDefault()

        if (stopTween) {
          stopTween()
          stopTween = null
        }

        pendingIndex = targetIndex
        const from = el.scrollLeft
        const to = Math.max(
          0,
          Math.min(
            getOffsetForIndex(itemWidthsRef.current, targetIndex),
            el.scrollWidth - el.clientWidth,
          ),
        )
        const idx = targetIndex

        stopTween = tween(
          from,
          to,
          SETTLE_DURATION,
        )(
          v => {
            scrollTo(v)
          },
          () => {
            stopTween = null
            pendingIndex = null
            onSettle(idx)
          },
        )
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      if (stopTween) stopTween()
    }
  }, [
    scrollRef,
    itemWidthsRef,
    currentIndexRef,
    scrollTo,
    onSettle,
    itemCount,
    resetKey,
  ])
}
