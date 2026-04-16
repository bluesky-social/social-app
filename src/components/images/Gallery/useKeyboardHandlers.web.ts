import {useEffect} from 'react'
import {type FlatList} from 'react-native'

import {tween} from '#/components/images/Gallery/tween'
import {getOffsetForIndex} from '#/components/images/Gallery/utils'

const SETTLE_DURATION = 700

export function useKeyboardHandlers({
  flatListRef,
  itemWidthsRef,
  currentIndexRef,
  scrollTo,
  onSettle,
  imageCount,
}: {
  flatListRef: React.RefObject<FlatList | null>
  itemWidthsRef: React.RefObject<Map<number, number>>
  currentIndexRef: React.RefObject<number>
  scrollTo: (offset: number) => void
  onSettle: (index: number) => void
  imageCount: number
}) {
  useEffect(() => {
    if (imageCount <= 1) return

    let stopTween: (() => void) | null = null
    let pendingIndex: number | null = null

    const onKeyDown = (e: KeyboardEvent) => {
      const el =
        flatListRef.current?.getScrollableNode() as unknown as HTMLElement | null
      if (!el || !el.contains(document.activeElement)) return

      const current = pendingIndex ?? currentIndexRef.current
      let targetIndex: number | undefined

      if (e.key === 'ArrowRight') {
        if (current < imageCount - 1) {
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
        const to = getOffsetForIndex(itemWidthsRef.current, targetIndex)
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
    flatListRef,
    itemWidthsRef,
    currentIndexRef,
    scrollTo,
    onSettle,
    imageCount,
  ])
}
