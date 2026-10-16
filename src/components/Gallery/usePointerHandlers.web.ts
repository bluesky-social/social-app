import {useEffect} from 'react'

import {ITEM_GAP} from '#/components/Gallery/const'
import {isEditableTarget} from '#/components/Gallery/domUtils'
import {tween} from '#/components/Gallery/tween'
import {type NavigationHandlerArgs} from '#/components/Gallery/types'
import {getIndexForOffset, getOffsetForIndex} from '#/components/Gallery/utils'
import {IS_WEB_SAFARI} from '#/env'

const DRAG_THRESHOLD = 3
const FLICK_DECAY = 0.85
const FLICK_MIN_VELOCITY = 0.1
const ADVANCE_THRESHOLD = 0.15
const FRAME_MS = 1000 / 60
const SETTLE_DURATION = 700
const OVERSCROLL_RESISTANCE = 0.4
const BOUNCE_DURATION = 700

function whichByDistance(
  itemWidths: Map<number, number>,
  currentIndex: number,
  distance: number,
  direction: -1 | 1,
  itemCount: number,
): number {
  let remaining = distance
  let i = currentIndex

  while (remaining > 0 && i >= 0 && i < itemCount) {
    const w = (itemWidths.get(i) ?? 0) + ITEM_GAP
    if (remaining > w) {
      remaining -= w
      i -= direction
    } else if (remaining > w * ADVANCE_THRESHOLD) {
      i -= direction
      break
    } else {
      break
    }
  }

  return Math.max(0, Math.min(i, itemCount - 1))
}

export function usePointerHandlers({
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

    const el = scrollRef.current?.getScrollableNode() as HTMLElement | null
    if (!el) return

    let isDragging = false
    let isMouseDown = false
    let startX = 0
    let dragScrollLeft = 0
    let delta = 0
    let prevDelta = 0
    let velo = 0
    let t = 0
    let stopTween: (() => void) | null = null
    let localIndex = currentIndexRef.current
    let overscrollX = 0

    el.style.cursor = 'grab'

    const clearOverscroll = () => {
      overscrollX = 0
      el.style.transform = ''
    }

    /*
     * We don't preventDefault on mousedown, since that would break focus and
     * text selection inside arbitrary children. Native image and link drags
     * are suppressed here instead.
     */
    const onDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.closest?.('img, a')) e.preventDefault()
    }

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0 || e.defaultPrevented) return
      // Leave text fields, selects and sliders to behave normally
      if (isEditableTarget(e.target)) return

      // Cancel any in-progress tween
      if (stopTween) {
        stopTween()
        stopTween = null
      }
      clearOverscroll()

      isMouseDown = true
      isDragging = false
      localIndex = currentIndexRef.current
      startX = e.pageX
      dragScrollLeft = el.scrollLeft
      delta = 0
      prevDelta = 0
      velo = 0
      t = e.timeStamp
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return

      const x = e.pageX - startX

      // Require minimum movement before starting drag
      if (!isDragging && Math.abs(x) < DRAG_THRESHOLD) return

      if (!isDragging) {
        isDragging = true
        el.style.cursor = 'grabbing'
        el.style.userSelect = 'none'

        // Blur focused element within the gallery
        if (el.contains(document.activeElement)) {
          ;(document.activeElement as HTMLElement)?.blur?.()
        }
        // Don't leave behind a text selection from dragging across content
        window.getSelection?.()?.removeAllRanges()
      }

      e.preventDefault()

      // Track velocity
      const elapsed = e.timeStamp - t || 1
      prevDelta = delta
      delta = x
      velo = (delta - prevDelta) / (elapsed * FRAME_MS)
      t = e.timeStamp

      const desiredScroll = dragScrollLeft - delta
      const maxScroll = el.scrollWidth - el.clientWidth

      if (desiredScroll < 0) {
        // Overscroll at start — rubber band
        scrollTo(0)
        overscrollX = desiredScroll * OVERSCROLL_RESISTANCE
        el.style.transform = `translateX(${-overscrollX}px)`
      } else if (desiredScroll > maxScroll) {
        // Overscroll at end — rubber band
        scrollTo(maxScroll)
        overscrollX = (desiredScroll - maxScroll) * OVERSCROLL_RESISTANCE
        el.style.transform = `translateX(${-overscrollX}px)`
      } else {
        // Normal scroll range
        scrollTo(desiredScroll)
        if (overscrollX !== 0) clearOverscroll()
      }

      // Update local index from scroll position (only in normal range)
      if (overscrollX === 0) {
        localIndex = getIndexForOffset(
          itemWidthsRef.current,
          desiredScroll,
          itemCount,
        )
      }
    }

    const onMouseUp = () => {
      if (!isMouseDown) return

      const wasDragging = isDragging
      isMouseDown = false
      isDragging = false

      el.style.cursor = 'grab'
      el.style.userSelect = ''

      if (wasDragging) {
        // Suppress the click that follows mouseup after a drag
        const suppressClick = (e: MouseEvent) => {
          // Stopping propagation alone still allows native link navigation.
          e.preventDefault()
          e.stopPropagation()
        }
        el.addEventListener('click', suppressClick, {
          once: true,
          capture: true,
        })
        /*
         * The click fires right after mouseup. If there isn't one (e.g. the
         * pointer was released elsewhere), don't swallow the next real click.
         */
        setTimeout(() => {
          el.removeEventListener('click', suppressClick, {capture: true})
        }, 0)

        if (overscrollX !== 0) {
          // Bounce back from overscroll
          const targetIndex = overscrollX > 0 ? itemCount - 1 : 0
          const fromOverscroll = overscrollX

          stopTween = tween(
            fromOverscroll,
            0,
            BOUNCE_DURATION,
          )(
            v => {
              el.style.transform = `translateX(${-v}px)`
            },
            () => {
              stopTween = null
              clearOverscroll()
              onSettle(targetIndex)
            },
          )
        } else {
          // Normal flick settle
          let v = Math.abs(velo)
          let restingDistance = 0
          while (v > FLICK_MIN_VELOCITY) {
            v *= FLICK_DECAY
            restingDistance += v
          }

          const direction: -1 | 1 = delta < 0 ? -1 : 1
          const totalDistance = Math.abs(delta) + restingDistance

          const targetIndex = whichByDistance(
            itemWidthsRef.current,
            localIndex,
            totalDistance,
            direction,
            itemCount,
          )

          const from = el.scrollLeft
          const to = Math.max(
            0,
            Math.min(
              getOffsetForIndex(itemWidthsRef.current, targetIndex),
              el.scrollWidth - el.clientWidth,
            ),
          )

          if (from === to) {
            onSettle(targetIndex)
            return
          }

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
              onSettle(targetIndex)
            },
          )
        }
      }
    }

    /*
     * Safari does not support `overscroll-behavior`, so a horizontal trackpad
     * swipe over the carousel can trigger the browser's back/forward
     * navigation gesture. We intercept predominantly-horizontal wheel events
     * and apply the scroll ourselves, calling preventDefault to suppress the
     * history-nav gesture. Vertical-dominant wheel events are left untouched so
     * normal page scroll still works. Chrome/Firefox are covered by the
     * `overscrollBehaviorX: 'contain'` style on the scroll view.
     *
     * Listener must be non-passive so preventDefault is honored.
     */
    const onWheel = (e: WheelEvent) => {
      if (!IS_WEB_SAFARI) return
      // Only act on predominantly-horizontal scrolls. Vertical-dominant events
      // are page scroll and must not be swallowed.
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return

      e.preventDefault()

      // Cancel any in-progress settle tween so manual scrolling feels direct.
      if (stopTween) {
        stopTween()
        stopTween = null
      }
      if (overscrollX !== 0) clearOverscroll()

      const maxScroll = el.scrollWidth - el.clientWidth
      const next = Math.max(0, Math.min(el.scrollLeft + e.deltaX, maxScroll))
      scrollTo(next)

      // Keep the active index in sync so keyboard/lightbox stay correct, but
      // only settle when it actually changes - onSettle moves focus, which we
      // don't want to thrash on every wheel tick.
      const index = getIndexForOffset(itemWidthsRef.current, next, itemCount)
      if (index !== localIndex) {
        localIndex = index
        onSettle(index)
      }
    }

    el.addEventListener('mousedown', onMouseDown)
    el.addEventListener('dragstart', onDragStart)
    el.addEventListener('wheel', onWheel, {passive: false})
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      el.removeEventListener('mousedown', onMouseDown)
      el.removeEventListener('dragstart', onDragStart)
      el.removeEventListener('wheel', onWheel)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      if (stopTween) stopTween()
      clearOverscroll()
      el.style.cursor = ''
      el.style.userSelect = ''
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
