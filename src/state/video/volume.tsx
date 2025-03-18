import React from 'react'

import * as persisted from '#/state/persisted'

const Context = React.createContext<{
  volume: persisted.Schema['videoVolume']
  setVolume: (v: persisted.Schema['videoVolume']) => void
} | null>(null)

export function Provider({children}: {children: React.ReactNode}) {
  const [volume, setVolume] = React.useState(persisted.get('videoVolume'))

  const value = React.useMemo(
    () => ({
      volume,
      setVolume: (_volume: persisted.Schema['videoVolume']) => {
        setVolume(_volume)
        persisted.write('videoVolume', _volume)
      },
    }),
    [volume],
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
