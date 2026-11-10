import {createContext, useContext} from 'react'

export const GalleryContext = createContext<{
  label: string
  itemKeys: string[]
  activeIndex: number
  activateIndex: (index: number) => void
} | null>(null)
GalleryContext.displayName = 'GalleryContext'

export function useGalleryContext() {
  const context = useContext(GalleryContext)
  if (!context) {
    throw new Error('GalleryPageDots must be rendered inside Gallery.Root')
  }
  return context
}
