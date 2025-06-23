let latestBandwidthEstimate: number | undefined

export function get() {
  return latestBandwidthEstimate
}

export function set(estimate: number) {
  if (!isNaN(estimate)) {
    latestBandwidthEstimate = estimate
  }
}
