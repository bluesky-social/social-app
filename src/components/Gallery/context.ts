import {createContext, useContext} from 'react'

export const GalleryContext = createContext<{
  label: string
  itemKeys: string[]
  activeIndex: number
} | null>(null)
GalleryContext.displayName = 'GalleryContext'

export function useGalleryContext() {
  const context = useContext(GalleryContext)
  if (!context) {
    throw new Error('useGalleryContext must be used within Gallery.Root')
  }
  return context
}
