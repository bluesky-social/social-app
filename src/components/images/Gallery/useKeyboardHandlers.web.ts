import {useEffect} from 'react'
import {type FlatList} from 'react-native'

export function useKeyboardHandlers({
  flatListRef,
  currentIndexRef,
  scrollToIndex,
  imageCount,
}: {
  flatListRef: React.RefObject<FlatList | null>
  currentIndexRef: React.RefObject<number>
  scrollToIndex: (index: number, animated?: boolean) => void
  imageCount: number
}) {
  useEffect(() => {
    if (imageCount <= 1) return

    const onKeyDown = (e: KeyboardEvent) => {
      const el = flatListRef.current?.getScrollableNode() as unknown as HTMLElement | null
      if (!el || !el.contains(document.activeElement)) return

      const current = currentIndexRef.current
      if (e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey)) {
        const next = current + 1
        if (next < imageCount) {
          e.preventDefault()
          scrollToIndex(next)
          currentIndexRef.current = next
        }
      } else if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) {
        const prev = current - 1
        if (prev >= 0) {
          e.preventDefault()
          scrollToIndex(prev)
          currentIndexRef.current = prev
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [flatListRef, currentIndexRef, scrollToIndex, imageCount])
}
