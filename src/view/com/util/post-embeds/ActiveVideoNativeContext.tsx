import React from 'react'
import {useVideoPlayer, VideoPlayer} from 'expo-video'

import {isNative} from '#/platform/detection'

const Context = React.createContext<{
  activeSource: string | null
  setActiveSource: (src: string) => void
  player: VideoPlayer | null
} | null>(null)

export function Provider({children}: {children: React.ReactNode}) {
  if (!isNative) {
    throw new Error('ActiveVideoProvider may only be used on native.')
  }

  const [activeSource, setActiveSource] = React.useState('')

  const player = useVideoPlayer(activeSource, p => {
    p.muted = true
    p.loop = true
    p.play()
  })

  return (
    <Context.Provider value={{activeSource, setActiveSource, player}}>
      {children}
    </Context.Provider>
  )
}

export function useActiveVideoNativeView({source}: {source: string}) {
  const context = React.useContext(Context)
  if (!context) {
    throw new Error(
      'useActiveVideoView must be used within a ActiveVideoProvider',
    )
  }
  const {activeSource, setActiveSource} = context

  return {
    active: source == activeSource,
    setActive: (source: string) => {
      setActiveSource(source)
    },
  }
}
