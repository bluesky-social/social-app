import React, {useCallback, useId, useMemo, useRef, useState} from 'react'
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
  const [manuallySet, setManuallySet] = useState(false)
  const {height: windowHeight} = useWindowDimensions()

  const value = useMemo(
    () => ({
      activeViewId,
      setActiveView: (viewId: string, src: string) => {
        setActiveViewId(viewId)
        setSource(src)
        setManuallySet(true)
        // we don't know the exact position, but it's definitely on screen
        // so just guess that it's in the middle. Any value is fine
        // so long as it's not offscreen
        activeViewLocationRef.current = windowHeight / 2
      },
      sendViewPosition: (viewId: string, y: number) => {
        if (isNative) return

        // console.log(
        //   'sendViewPosition',
        //   viewId,
        //   y,
        //   activeViewId,
        //   activeViewLocationRef.current,
        // )

        if (viewId === activeViewId) {
          activeViewLocationRef.current = y
        } else {
          if (
            distanceToIdealPosition(y) <
            distanceToIdealPosition(activeViewLocationRef.current)
          ) {
            // if the old view was manually set, only usurp if the old view is offscreen
            if (manuallySet && withinViewport(activeViewLocationRef.current))
              return

            setActiveViewId(viewId)
            activeViewLocationRef.current = y
          }
        }

        function distanceToIdealPosition(yPos: number) {
          return Math.abs(yPos - windowHeight / 3)
        }

        function withinViewport(yPos: number) {
          return yPos > 0 && yPos < windowHeight
        }
      },
    }),
    [activeViewId, windowHeight, manuallySet],
  )

  return (
    <ActiveVideoContext.Provider value={value}>
      <VideoPlayerProvider source={source ?? ''} viewId={activeViewId}>
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
