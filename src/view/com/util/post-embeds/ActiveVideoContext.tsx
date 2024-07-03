import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import {useWindowDimensions} from 'react-native'

import {VideoPlayerProvider} from './VideoPlayerContext'

const ActiveVideoContext = React.createContext<{
  activeViewId: string | null
  setActiveView: (viewId: string, src: string) => void
  registerMeasurementCallback: (
    viewId: string,
    callback: () => DOMRectReadOnly | void,
  ) => {remove: () => void}
} | null>(null)

export function ActiveVideoProvider({children}: {children: React.ReactNode}) {
  const [activeViewId, setActiveViewId] = useState<string | null>(null)
  const [source, setSource] = useState<string | null>(null)
  const {height: windowHeight} = useWindowDimensions()

  const measurementCallbacks = useRef<Record<string, () => DOMRect | void>>({})

  useEffect(() => {
    const findAndActivateVideo = () => {
      if (Object.keys(measurementCallbacks.current).length === 0) {
        return
      }

      const locations = Object.entries(measurementCallbacks.current).map(
        ([id, callback]) => ({
          id,
          rect: callback(),
        }),
      )

      const videosInView = locations.filter(
        ({rect}) => rect && rect.top >= 0 && rect.bottom <= windowHeight,
      )

      const active = closestToMiddle(windowHeight, videosInView)

      if (active) {
        setActiveViewId(active.id)
      }
    }
    findAndActivateVideo()
    const interval = setInterval(findAndActivateVideo, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [activeViewId, windowHeight])

  const value = useMemo(
    () => ({
      activeViewId,
      setActiveView: (viewId: string, src: string) => {
        setActiveViewId(viewId)
        setSource(src)
      },
      registerMeasurementCallback: (viewId: string, callback: () => void) => {
        measurementCallbacks.current[viewId] = callback
        return {
          remove: () => {
            delete measurementCallbacks.current[viewId]
          },
        }
      },
    }),
    [activeViewId],
  )

  return (
    <ActiveVideoContext.Provider value={value}>
      <VideoPlayerProvider source={source ?? ''} viewId={activeViewId}>
        {children}
      </VideoPlayerProvider>
    </ActiveVideoContext.Provider>
  )
}

export function useActiveVideoView({
  source,
  measure,
}: {
  source: string
  measure: () => void
}) {
  const context = React.useContext(ActiveVideoContext)
  if (!context) {
    throw new Error('useActiveVideo must be used within a ActiveVideoProvider')
  }
  const id = useId()

  useEffect(() => {
    const sub = context.registerMeasurementCallback(id, measure)
    return () => {
      sub.remove()
    }
  }, [context, id, measure])

  return {
    active: context.activeViewId === id,
    setActive: useCallback(
      () => context.setActiveView(id, source),
      [context, id, source],
    ),
  }
}

function closestToMiddle(
  windowHeight: number,
  elements: {id: string; rect: DOMRect | void}[],
) {
  // actually gonna target 1/3 of the way down the screen
  // so that the top post probably is the one that gets activated
  const middle = windowHeight / 3
  let closest = elements[0]

  for (const element of elements) {
    if (!element.rect) {
      continue
    }
    if (!closest.rect) {
      closest = element
      continue
    }
    if (
      Math.abs(element.rect.top + element.rect.height / 2 - middle) <
      Math.abs(closest.rect.top + closest.rect.height / 2 - middle)
    ) {
      closest = element
    }
  }

  return closest
}
