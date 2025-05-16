type BandwidthEstimateContext = {
  getBandwidthEstimate: () => number | undefined
  setLatestEstimate: (estimate: number) => void
}

export function Provider({children}: {children: React.ReactNode}) {
  return <>{children}</>
}

export function useBandwidthEstimate(): BandwidthEstimateContext {
  throw new Error('useBandwidthEstimate is only available on web')
}
