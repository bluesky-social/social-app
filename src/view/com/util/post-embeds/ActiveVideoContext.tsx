import React, {useCallback, useId, useMemo, useState} from 'react'

import {VideoPlayerProvider} from './VideoPlayerContext'

const ActiveVideoContext = React.createContext<{
  activeViewId: string | null
  setActiveView: (viewId: string, src: string) => void
} | null>(null)

export function ActiveVideoProvider({children}: {children: React.ReactNode}) {
  const [activeViewId, setActiveViewId] = useState<string | null>(null)
  const [source, setSource] = useState<string | null>(null)

  const value = useMemo(
    () => ({
      activeViewId,
      setActiveView: (viewId: string, src: string) => {
        setActiveViewId(viewId)
        setSource(src)
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

export function useActiveVideoView() {
  const context = React.useContext(ActiveVideoContext)
  if (!context) {
    throw new Error('useActiveVideo must be used within a ActiveVideoProvider')
  }
  const id = useId()

  return {
    active: context.activeViewId === id,
    setActive: useCallback(
      (source: string) => context.setActiveView(id, source),
      [context, id],
    ),
  }
}
