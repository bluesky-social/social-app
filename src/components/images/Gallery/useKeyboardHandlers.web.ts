import {useEffect} from 'react'
import {type FlatList} from 'react-native'

import {ITEM_GAP} from '#/components/images/Gallery/const'
import {tween} from '#/components/images/Gallery/tween'

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

    const onKeyDown = (e: KeyboardEvent) => {
      const el =
        flatListRef.current?.getScrollableNode() as unknown as HTMLElement | null
      if (!el || !el.contains(document.activeElement)) return

      const current = currentIndexRef.current
      let targetIndex: number | undefined

      if (e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey)) {
        if (current < imageCount - 1) {
          targetIndex = current + 1
        }
      } else if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) {
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

        const from = el.scrollLeft
        const to = getOffsetForIndex(itemWidthsRef.current, targetIndex)
        const idx = targetIndex

        stopTween = tween(from, to, SETTLE_DURATION)(
          v => {
            scrollTo(v)
          },
          () => {
            stopTween = null
            currentIndexRef.current = idx
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
  }, [flatListRef, itemWidthsRef, currentIndexRef, scrollTo, onSettle, imageCount])
}
