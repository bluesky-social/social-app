import {createContext, useContext, useMemo, useRef} from 'react'

type BandwidthEstimateContext = {
  getBandwidthEstimate: () => number | undefined
  setLatestEstimate: (estimate: number) => void
}

const Context = createContext<BandwidthEstimateContext | null>(null)

export function Provider({children}: {children: React.ReactNode}) {
  const bandwidthEstimateRef = useRef<number | undefined>(undefined)

  const value = useMemo(
    () => ({
      getBandwidthEstimate: () => bandwidthEstimateRef.current,
      setLatestEstimate: (estimate: number) => {
        bandwidthEstimateRef.current = estimate
      },
    }),
    [],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useBandwidthEstimate() {
  const context = useContext(Context)
  if (!context) {
    throw new Error(
      'useVideoVolumeState must be used within a VideoVolumeProvider',
    )
  }
  return context
}
