import React from 'react'

const Context = React.createContext(
  {} as {
    volume: number
    setVolume: (volume: number) => void
    muted: boolean
    setMuted: (muted: boolean) => void
  },
)

export function Provider({children}: {children: React.ReactNode}) {
  const [volume, setVolume] = React.useState(0.5)
  const [muted, setMuted] = React.useState(true)

  const value = React.useMemo(
    () => ({
      volume,
      setVolume,
      muted,
      setMuted,
    }),
    [volume, setVolume, muted, setMuted],
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
  return context
}
