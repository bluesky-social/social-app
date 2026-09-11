/**
 * Maps values with bounded concurrency, then retries eligible failures one at
 * a time. Successful results from the concurrent attempt are reused.
 */
export async function mapWithSerialRetry<T, U>(
  values: T[],
  mapper: (value: T, index: number) => Promise<U>,
  {
    concurrency,
    shouldRetry,
    onRetry,
    onDiscard,
  }: {
    concurrency: number
    shouldRetry: (error: unknown) => boolean
    onRetry?: (error: unknown, index: number) => void
    onDiscard?: (value: U, index: number) => void
  },
): Promise<U[]> {
  const settled = new Array<PromiseSettledResult<U>>(values.length)
  let nextIndex = 0

  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex++
      try {
        settled[index] = {
          status: 'fulfilled',
          value: await mapper(values[index], index),
        }
      } catch (reason) {
        settled[index] = {status: 'rejected', reason}
      }
    }
  }

  const workerCount = Math.min(
    values.length,
    Math.max(1, Math.floor(concurrency)),
  )
  await Promise.all(Array.from({length: workerCount}, worker))

  const completed: {value: U; index: number}[] = []
  for (let i = 0; i < settled.length; i++) {
    const result = settled[i]
    if (result.status === 'fulfilled') {
      completed.push({value: result.value, index: i})
    }
  }

  const discardCompleted = () => {
    for (const result of completed) {
      onDiscard?.(result.value, result.index)
    }
  }

  const nonRetryableFailure = settled.find(
    result => result.status === 'rejected' && !shouldRetry(result.reason),
  )
  if (nonRetryableFailure?.status === 'rejected') {
    discardCompleted()
    throw nonRetryableFailure.reason
  }

  const results = new Array<U>(values.length)
  try {
    for (let i = 0; i < settled.length; i++) {
      const result = settled[i]
      if (result.status === 'fulfilled') {
        results[i] = result.value
      } else {
        onRetry?.(result.reason, i)
        const value = await mapper(values[i], i)
        results[i] = value
        completed.push({value, index: i})
      }
    }
  } catch (error) {
    discardCompleted()
    throw error
  }

  return results
}
