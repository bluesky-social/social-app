import React from 'react'
import {AppBskyActorDefs} from '@atproto/api'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'

type ProfileImageLightbox = {
  type: 'profile-image'
  profile: AppBskyActorDefs.ProfileViewDetailed
}

type ImagesLightboxItem = {
  uri: string
  thumbUri: string
  alt?: string
}

type ImagesLightbox = {
  type: 'images'
  images: ImagesLightboxItem[]
  index: number
}

type Lightbox = ProfileImageLightbox | ImagesLightbox

const LightboxContext = React.createContext<{
  activeLightbox: Lightbox | null
}>({
  activeLightbox: null,
})

const LightboxControlContext = React.createContext<{
  openLightbox: (lightbox: Lightbox) => void
  closeLightbox: () => boolean
}>({
  openLightbox: () => {},
  closeLightbox: () => false,
})

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [activeLightbox, setActiveLightbox] = React.useState<Lightbox | null>(
    null,
  )

  const openLightbox = useNonReactiveCallback((lightbox: Lightbox) => {
    setActiveLightbox(lightbox)
  })

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
