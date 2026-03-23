import {createContext, useContext, useMemo, useState} from 'react'
import {nanoid} from 'nanoid/non-secure'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {type ImageSource} from '#/view/com/lightbox/ImageViewing/@types'

export type Lightbox = {
  id: string
  images: ImageSource[]
  index: number
}

const LightboxContext = createContext<{
  activeLightbox: Lightbox | null
}>({
  activeLightbox: null,
})
LightboxContext.displayName = 'LightboxContext'

const LightboxControlContext = createContext<{
  openLightbox: (lightbox: Omit<Lightbox, 'id'>) => void
  closeLightbox: () => boolean
}>({
  openLightbox: () => {},
  closeLightbox: () => false,
})
LightboxControlContext.displayName = 'LightboxControlContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [activeLightbox, setActiveLightbox] = useState<Lightbox | null>(null)

  const openLightbox = useNonReactiveCallback(
    (lightbox: Omit<Lightbox, 'id'>) => {
      setActiveLightbox(prevLightbox => {
        if (prevLightbox) {
          // Ignore duplicate open requests. If it's already open,
          // the user has to explicitly close the previous one first.
          return prevLightbox
        } else {
          return {...lightbox, id: nanoid()}
        }
      })
    },
  )

  const closeLightbox = useNonReactiveCallback(() => {
    let wasActive = !!activeLightbox
    setActiveLightbox(null)
    return wasActive
  })

  const state = useMemo(
    () => ({
      activeLightbox,
    }),
    [activeLightbox],
  )

  const methods = useMemo(
    () => ({
      openLightbox,
      closeLightbox,
    }),
    [openLightbox, closeLightbox],
  )

  return (
    <LightboxContext.Provider value={state}>
      <LightboxControlContext.Provider value={methods}>
        {children}
      </LightboxControlContext.Provider>
    </LightboxContext.Provider>
  )
}

export function useLightbox() {
  return useContext(LightboxContext)
}

export function useLightboxControls() {
  return useContext(LightboxControlContext)
}
