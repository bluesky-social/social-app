import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import {useWindowDimensions} from 'react-native'

import {isNative, isWeb} from '#/platform/detection'

const Context = React.createContext<{
  activeViewId: string | null
  setActiveView: (viewId: string) => void
  sendViewPosition: (viewId: string, y: number) => void
} | null>(null)

export function Provider({children}: {children: React.ReactNode}) {
  if (!isWeb) {
    throw new Error('ActiveVideoWebContext may only be used on web.')
  }

  const [activeViewId, setActiveViewId] = useState<string | null>(null)
  const activeViewLocationRef = useRef(Infinity)
  const {height: windowHeight} = useWindowDimensions()

  // minimising re-renders by using refs
  const manuallySetRef = useRef(false)
  const activeViewIdRef = useRef(activeViewId)
  useEffect(() => {
    activeViewIdRef.current = activeViewId
  }, [activeViewId])

  const setActiveView = useCallback(
    (viewId: string) => {
      setActiveViewId(viewId)
      manuallySetRef.current = true
      // we don't know the exact position, but it's definitely on screen
      // so just guess that it's in the middle. Any value is fine
      // so long as it's not offscreen
      activeViewLocationRef.current = windowHeight / 2
    },
    [windowHeight],
  )

  const sendViewPosition = useCallback(
    (viewId: string, y: number) => {
      if (isNative) return

      if (viewId === activeViewIdRef.current) {
        activeViewLocationRef.current = y
      } else {
        if (
          distanceToIdealPosition(y) <
          distanceToIdealPosition(activeViewLocationRef.current)
        ) {
          // if the old view was manually set, only usurp if the old view is offscreen
          if (
            manuallySetRef.current &&
            withinViewport(activeViewLocationRef.current)
          ) {
            return
          }

          setActiveViewId(viewId)
          activeViewLocationRef.current = y
          manuallySetRef.current = false
        }
      }

      function distanceToIdealPosition(yPos: number) {
        return Math.abs(yPos - windowHeight / 2.5)
      }

      function withinViewport(yPos: number) {
        return yPos > 0 && yPos < windowHeight
      }
    },
    [windowHeight],
  )

  const value = useMemo(
    () => ({
      activeViewId,
      setActiveView,
      sendViewPosition,
    }),
    [activeViewId, setActiveView, sendViewPosition],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useActiveVideoWeb() {
  const context = React.useContext(Context)
  if (!context) {
    throw new Error(
      'useActiveVideoWeb must be used within a ActiveVideoWebProvider',
    )
  }

  const {activeViewId, setActiveView, sendViewPosition} = context
  const id = useId()

  return {
    active: activeViewId === id,
    setActive: () => {
      setActiveView(id)
    },
    currentActiveView: activeViewId,
    sendPosition: (y: number) => sendViewPosition(id, y),
  }
}
