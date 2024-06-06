import {
  createContext,
  PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from 'react'
import {AppBskyActorDefs} from '@atproto/api'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'

interface Lightbox {
  name: string
}

export class ProfileImageLightbox implements Lightbox {
  name = 'profile-image'
  constructor(public profile: AppBskyActorDefs.ProfileViewDetailed) {}
}

interface ImagesLightboxItem {
  uri: string
  alt?: string
}

export class ImagesLightbox implements Lightbox {
  name = 'images'
  constructor(public images: ImagesLightboxItem[], public index: number) {}
  setIndex(index: number) {
    this.index = index
  }
}

const LightboxContext = createContext<{
  activeLightbox: Lightbox | null
}>({
  activeLightbox: null,
})

const LightboxControlContext = createContext<{
  openLightbox: (lightbox: Lightbox) => void
  closeLightbox: () => boolean
}>({
  openLightbox: () => {},
  closeLightbox: () => false,
})

export function Provider({children}: PropsWithChildren<{}>) {
  const [activeLightbox, setActiveLightbox] = useState<Lightbox | null>(null)

  const openLightbox = useNonReactiveCallback((lightbox: Lightbox) => {
    setActiveLightbox(lightbox)
  })

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
