import React from 'react'
import {nanoid} from 'nanoid/non-secure'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {ImageSource} from '#/view/com/lightbox/ImageViewing/@types'

export type Lightbox = {
  id: string
  images: ImageSource[]
  index: number
}

const LightboxContext = React.createContext<{
  activeLightbox: Lightbox | null
}>({
  activeLightbox: null,
})

const LightboxControlContext = React.createContext<{
  openLightbox: (lightbox: Omit<Lightbox, 'id'>) => void
  closeLightbox: () => boolean
}>({
  openLightbox: () => {},
  closeLightbox: () => false,
})

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [activeLightbox, setActiveLightbox] = React.useState<Lightbox | null>(
    null,
  )

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

  const state = React.useMemo(
    () => ({
      activeLightbox,
    }),
    [activeLightbox],
  )

  const methods = React.useMemo(
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
  return React.useContext(LightboxContext)
}

export function useLightboxControls() {
  return React.useContext(LightboxControlContext)
}
