import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import {useWindowDimensions} from 'react-native'

import {isNative} from '#/platform/detection'
import {VideoPlayerProvider} from './VideoPlayerContext'

const ActiveVideoContext = React.createContext<{
  activeViewId: string | null
  setActiveView: (viewId: string, src: string) => void
  sendViewPosition: (viewId: string, y: number) => void
} | null>(null)

export function ActiveVideoProvider({children}: {children: React.ReactNode}) {
  const [activeViewId, setActiveViewId] = useState<string | null>(null)
  const activeViewLocationRef = useRef(Infinity)
  const [source, setSource] = useState<string | null>(null)
  const {height: windowHeight} = useWindowDimensions()

  // minimising re-renders by using refs
  const manuallySetRef = useRef(false)
  const activeViewIdRef = useRef(activeViewId)
  useEffect(() => {
    activeViewIdRef.current = activeViewId
  }, [activeViewId])

  const setActiveView = useCallback(
    (viewId: string, src: string) => {
      setActiveViewId(viewId)
      setSource(src)
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

  return (
    <ActiveVideoContext.Provider value={value}>
      <VideoPlayerProvider source={source ?? ''}>
        {children}
      </VideoPlayerProvider>
    </ActiveVideoContext.Provider>
  )
}

export function useActiveVideoView({source}: {source: string}) {
  const context = React.useContext(ActiveVideoContext)
  if (!context) {
    throw new Error('useActiveVideo must be used within a ActiveVideoProvider')
  }
  const id = useId()

  return {
    active: context.activeViewId === id,
    setActive: useCallback(
      () => context.setActiveView(id, source),
      [context, id, source],
    ),
    currentActiveView: context.activeViewId,
    sendPosition: useCallback(
      (y: number) => context.sendViewPosition(id, y),
      [context, id],
    ),
  }
}
