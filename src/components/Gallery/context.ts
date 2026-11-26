import {createContext, useContext} from 'react'

export const GalleryContext = createContext<{
  label: string
  itemKeys: string[]
  /** The leading item, i.e. the first one more than halfway in view. */
  activeIndex: number
  /**
   * The leading item once scrolled as far as possible. Items after it are
   * already in view there, so navigating past it doesn't move anything.
   */
  endIndex: number
  /** Left-aligns an item within the scroll bounds without selecting its dot. */
  revealIndex: (index: number) => void
} | null>(null)
GalleryContext.displayName = 'GalleryContext'

export function useGalleryContext() {
  const context = useContext(GalleryContext)
  if (!context) {
    throw new Error('useGalleryContext must be used within Gallery.Root')
  }
  return context
}
