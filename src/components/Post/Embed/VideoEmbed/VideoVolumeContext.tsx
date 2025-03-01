import React from 'react'

const Context = React.createContext<{
  // native
  muted: boolean
  setMuted: React.Dispatch<React.SetStateAction<boolean>>
  // web
  volume: number
  setVolume: React.Dispatch<React.SetStateAction<number>>
} | null>(null)

export function Provider({children}: {children: React.ReactNode}) {
  const [muted, setMuted] = React.useState(true)
  const [volume, setVolume] = React.useState(1)

  const value = React.useMemo(
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
  const context = React.useContext(Context)
  if (!context) {
    throw new Error(
      'useVideoVolumeState must be used within a VideoVolumeProvider',
    )
  }
  return [context.volume, context.setVolume] as const
}

export function useVideoMuteState() {
  const context = React.useContext(Context)
  if (!context) {
    throw new Error(
      'useVideoMuteState must be used within a VideoVolumeProvider',
    )
  }
  return [context.muted, context.setMuted] as const
}
