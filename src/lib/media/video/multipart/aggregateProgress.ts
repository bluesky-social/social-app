/**
 * Tracks bytes sent per part and reports overall progress (0..1) to the
 * existing single-value progress callback. Parts upload concurrently, so each
 * part reports its own running byte count and this sums them against the total.
 */
export function createProgressAggregator(
  totalBytes: number,
  setProgress: (progress: number) => void,
) {
  const sentByPart = new Map<number, number>()
  return function reportPartProgress(partNumber: number, bytesSent: number) {
    sentByPart.set(partNumber, bytesSent)
    let sum = 0
    for (const value of sentByPart.values()) {
      sum += value
    }
    setProgress(totalBytes > 0 ? Math.min(sum / totalBytes, 1) : 0)
  }
}
