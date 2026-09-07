import {mapWithSerialRetry} from './map-with-serial-retry'

describe('mapWithSerialRetry', () => {
  it('reuses successes and retries failures serially', async () => {
    const attempts = new Map<number, number>()
    let retriesInFlight = 0
    let maxRetriesInFlight = 0

    const result = await mapWithSerialRetry(
      [1, 2, 3],
      async value => {
        const attempt = (attempts.get(value) ?? 0) + 1
        attempts.set(value, attempt)

        if (value !== 1 && attempt === 1) {
          throw new Error('retryable')
        }

        if (attempt > 1) {
          retriesInFlight++
          maxRetriesInFlight = Math.max(maxRetriesInFlight, retriesInFlight)
          await Promise.resolve()
          retriesInFlight--
        }

        return value * 2
      },
      error => String(error).includes('retryable'),
    )

    expect(result).toEqual([2, 4, 6])
    expect(attempts).toEqual(
      new Map([
        [1, 1],
        [2, 2],
        [3, 2],
      ]),
    )
    expect(maxRetriesInFlight).toBe(1)
  })

  it('does not retry when any concurrent attempt fails permanently', async () => {
    const mapper = jest.fn((value: string) => Promise.reject(new Error(value)))

    await expect(
      mapWithSerialRetry(['retryable', 'permanent'], mapper, error =>
        String(error).includes('retryable'),
      ),
    ).rejects.toThrow('permanent')
    expect(mapper).toHaveBeenCalledTimes(2)
  })
})
