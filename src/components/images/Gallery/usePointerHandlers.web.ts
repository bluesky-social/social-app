import {useEffect} from 'react'
import {type FlatList} from 'react-native'

import {ITEM_GAP} from '#/components/images/Gallery/const'
import {tween} from '#/components/images/Gallery/tween'
const DRAG_THRESHOLD = 3
const FLICK_DECAY = 0.85
const FLICK_MIN_VELOCITY = 0.1
const ADVANCE_THRESHOLD = 0.15
const FRAME_MS = 1000 / 60
const SETTLE_DURATION = 600

function getOffsetForIndex(
  itemWidths: Map<number, number>,
  index: number,
): number {
  let offset = 0
  for (let i = 0; i < index; i++) {
    offset += (itemWidths.get(i) ?? 0) + ITEM_GAP
  }
  return offset
}

function whichByDistance(
  itemWidths: Map<number, number>,
  currentIndex: number,
  distance: number,
  direction: -1 | 1,
  imageCount: number,
): number {
  let remaining = distance
  let i = currentIndex

  while (remaining > 0 && i >= 0 && i < imageCount) {
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

  return Math.max(0, Math.min(i, imageCount - 1))
}

export function usePointerHandlers({
  flatListRef,
  itemWidthsRef,
  currentIndexRef,
  onSettle,
  imageCount,
}: {
  flatListRef: React.RefObject<FlatList | null>
  itemWidthsRef: React.RefObject<Map<number, number>>
  currentIndexRef: React.RefObject<number>
  onSettle: (index: number) => void
  imageCount: number
}) {
  useEffect(() => {
    if (imageCount <= 1) return

    const el =
      flatListRef.current?.getScrollableNode() as unknown as HTMLElement | null
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

    el.style.cursor = 'grab'

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault() // prevent native image drag

      // Cancel any in-progress tween
      if (stopTween) {
        stopTween()
        stopTween = null
      }

      isMouseDown = true
      isDragging = false
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
      }

      e.preventDefault()

      // Track velocity
      const elapsed = e.timeStamp - t || 1
      prevDelta = delta
      delta = x
      velo = (delta - prevDelta) / (elapsed * FRAME_MS)
      t = e.timeStamp

      el.scrollLeft = dragScrollLeft - delta

      // Update current index from scroll position
      const offsetX = el.scrollLeft
      let accumulated = 0
      for (let i = 0; i < imageCount; i++) {
        const w = (itemWidthsRef.current.get(i) ?? 0) + ITEM_GAP
        if (offsetX < accumulated + w / 2) {
          currentIndexRef.current = i
          break
        }
        accumulated += w
        if (i === imageCount - 1) currentIndexRef.current = i
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
        el.addEventListener('click', e => e.stopPropagation(), {
          once: true,
          capture: true,
        })

        // Estimate resting distance from velocity
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
          currentIndexRef.current,
          totalDistance,
          direction,
          imageCount,
        )

        // Tween from current scroll position to target
        const from = el.scrollLeft
        const to = getOffsetForIndex(itemWidthsRef.current, targetIndex)

        stopTween = tween(from, to, SETTLE_DURATION)(
          v => {
            el.scrollLeft = v
          },
          () => {
            stopTween = null
            currentIndexRef.current = targetIndex
            onSettle(targetIndex)
          },
        )
      }
    }

    el.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      el.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      if (stopTween) stopTween()
      el.style.cursor = ''
      el.style.userSelect = ''
    }
  }, [flatListRef, itemWidthsRef, currentIndexRef, onSettle, imageCount])
}
