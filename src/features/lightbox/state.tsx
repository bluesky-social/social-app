import {createContext, useContext, useEffect, useMemo, useState} from 'react'
import {
  measure,
  type MeasuredDimensions,
  runOnJS,
  runOnUI,
} from 'react-native-reanimated'
import {nanoid} from 'nanoid/non-secure'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {useHotkeysContext} from '#/lib/hotkeys'
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
  const {disableScope, enableScope} = useHotkeysContext()

  useEffect(() => {
    if (activeLightbox) {
      disableScope('global')
    } else {
      enableScope('global')
    }
  }, [activeLightbox, disableScope, enableScope])

  const doOpen = useNonReactiveCallback((lightbox: Omit<Lightbox, 'id'>) => {
    setActiveLightbox(prevLightbox => {
      if (prevLightbox) {
        // Ignore duplicate open requests. If it's already open,
        // the user has to explicitly close the previous one first.
        return prevLightbox
      } else {
        return {...lightbox, id: nanoid()}
      }
    })
  })

  const openLightbox = useNonReactiveCallback(
    (lightbox: Omit<Lightbox, 'id'>) => {
      const thumbRef = lightbox.images[lightbox.index]?.thumbRef
      if (thumbRef) {
        // Measure the tapped image on the UI thread, then open with
        // the rect baked in so it's available from the first render.
        // Only the rect (plain data) goes through runOnJS — AnimatedRef
        // objects can't survive serialization across threads.
        const openWithRect = (rect: MeasuredDimensions | null) => {
          doOpen({
            ...lightbox,
            images: lightbox.images.map((img, i) =>
              i === lightbox.index ? {...img, thumbRect: rect} : img,
            ),
          })
        }
        runOnUI(() => {
          'worklet'
          const rect = measure(thumbRef)
          runOnJS(openWithRect)(rect)
        })()
      } else {
        doOpen(lightbox)
      }
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
