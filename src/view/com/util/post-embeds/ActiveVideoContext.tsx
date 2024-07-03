import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'

import {VideoPlayerProvider} from './VideoPlayerContext'

const ActiveVideoContext = React.createContext<{
  activeViewId: string | null
  setActiveView: (viewId: string, src: string) => void
  requestActive: (viewId: string, src: string, y: number) => void
  allowUsurp: (viewId: string) => void
} | null>(null)

export function ActiveVideoProvider({children}: {children: React.ReactNode}) {
  const [activeViewId, setActiveViewId] = useState<string | null>(null)
  const [source, setSource] = useState<string | null>(null)

  const [canBeUsurped, setCanBeUsurped] = useState(false)
  const requestedViews = useRef<{[key: string]: {src: string; y: number}}>({})
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  const value = useMemo(
    () => ({
      activeViewId,
      setActiveView: (viewId: string, src: string) => {
        setActiveViewId(viewId)
        setSource(src)
        setCanBeUsurped(false)
      },
      requestActive: (viewId: string, src: string, y: number) => {
        if (activeViewId && !canBeUsurped) {
          return
        }
        if (requestedViews.current[viewId]) {
          requestedViews.current[viewId].y = y
          return
        }
        clearTimeout(timeoutRef.current)
        requestedViews.current[viewId] = {src, y}
        timeoutRef.current = setTimeout(() => {
          const sortedViews = Object.entries(requestedViews.current).sort(
            ([, {y: y1}], [, {y: y2}]) => y1 - y2,
          )
          const [topViewId, {src: topSrc}] = sortedViews[0]
          setActiveViewId(topViewId)
          setSource(topSrc)
          setCanBeUsurped(false)
          requestedViews.current = {}
        }, 100)
      },
      allowUsurp: (viewId: string) => {
        if (activeViewId === viewId) {
          setCanBeUsurped(true)
        }
      },
    }),
    [activeViewId, canBeUsurped],
  )

  return (
    <ActiveVideoContext.Provider value={value}>
      <VideoPlayerProvider source={source ?? ''} viewId={activeViewId}>
        {children}
      </VideoPlayerProvider>
    </ActiveVideoContext.Provider>
  )
}

export function useActiveVideoView(source: string) {
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
    requestActive: useCallback(
      (y: number) => context.requestActive(id, source, y),
      [context, id, source],
    ),
    allowUsurp: useCallback(() => context.allowUsurp(id), [context, id]),
  }
}
