import React from 'react'

import {device, useStorage} from '#/storage'

const Context = React.createContext<{
  muted: boolean
  setMuted: (v: boolean) => void
} | null>(null)

export function Provider({children}: {children: React.ReactNode}) {
  const [muted, setMuted] = React.useState(true)

  const value = React.useMemo(
    () => ({
      muted,
      setMuted,
    }),
    [muted],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useVideoMuteState() {
  const context = React.useContext(Context)
  if (!context) {
    throw new Error('useVideoMuteState must be used within a VideoMuteProvider')
  }
  return [context.muted, context.setMuted] as const
}

export function useVideoVolumeState() {
  const [volume = 1, setVolume] = useStorage(device, ['videoVolume'])

  return [volume, setVolume] as const
}
