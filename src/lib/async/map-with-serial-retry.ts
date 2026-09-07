/**
 * Maps all values concurrently, then retries eligible failures one at a time.
 * Successful results from the concurrent attempt are reused.
 */
export async function mapWithSerialRetry<T, U>(
  values: T[],
  mapper: (value: T, index: number) => Promise<U>,
  shouldRetry: (error: unknown) => boolean,
  onRetry?: (error: unknown, index: number) => void,
): Promise<U[]> {
  const settled = await Promise.allSettled(values.map(mapper))

  const nonRetryableFailure = settled.find(
    result => result.status === 'rejected' && !shouldRetry(result.reason),
  )
  if (nonRetryableFailure?.status === 'rejected') {
    throw nonRetryableFailure.reason
  }

  const results: U[] = []
  for (let i = 0; i < settled.length; i++) {
    const result = settled[i]
    if (result.status === 'fulfilled') {
      results.push(result.value)
    } else {
      onRetry?.(result.reason, i)
      results.push(await mapper(values[i], i))
    }
  }

  return results
}
