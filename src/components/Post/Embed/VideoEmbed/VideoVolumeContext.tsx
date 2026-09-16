import {createContext, useContext, useMemo, useState} from 'react'

import {device, useStorage} from '#/storage'

const Context = createContext<{
  muted: boolean
  setMuted: (v: boolean) => void
  // web
  volume: number
  setVolume: (v: number) => void
} | null>(null)
Context.displayName = 'VideoVolumeContext'

export function Provider({children}: {children: React.ReactNode}) {
  const [muted, setMuted] = useState(true)
  const [volume = 1, setVolume] = useStorage(device, ['videoVolume'])

  const value = useMemo(
    () => ({
      muted,
      setMuted,
      volume,
      setVolume,
    }),
    [muted, setMuted, volume, setVolume],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useVideoVolumeState() {
  const context = useContext(Context)
  if (!context) {
    throw new Error(
      'useVideoVolumeState must be used within a VideoVolumeProvider',
    )
  }
  return [context.volume, context.setVolume] as const
}

export function useVideoMuteState() {
  const context = useContext(Context)
  if (!context) {
    throw new Error(
      'useVideoMuteState must be used within a VideoVolumeProvider',
    )
  }
  return [context.muted, context.setMuted] as const
}
