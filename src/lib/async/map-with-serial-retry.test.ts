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
      {
        concurrency: 3,
        shouldRetry: error => String(error).includes('retryable'),
      },
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
      mapWithSerialRetry(['retryable', 'permanent'], mapper, {
        concurrency: 2,
        shouldRetry: error => String(error).includes('retryable'),
      }),
    ).rejects.toThrow('permanent')
    expect(mapper).toHaveBeenCalledTimes(2)
  })

  it('limits the concurrent attempts', async () => {
    let inFlight = 0
    let maxInFlight = 0
    let release: (() => void) | undefined
    const blocked = new Promise<void>(resolve => {
      release = resolve
    })

    const resultPromise = mapWithSerialRetry(
      [1, 2, 3, 4],
      async value => {
        inFlight++
        maxInFlight = Math.max(maxInFlight, inFlight)
        await blocked
        inFlight--
        return value
      },
      {
        concurrency: 2,
        shouldRetry: () => false,
      },
    )

    await Promise.resolve()
    expect(maxInFlight).toBe(2)
    release?.()
    await expect(resultPromise).resolves.toEqual([1, 2, 3, 4])
  })

  it('discards successful results when the batch fails', async () => {
    const onDiscard = jest.fn()

    await expect(
      mapWithSerialRetry(
        [1, 2, 3],
        value =>
          value === 2
            ? Promise.reject(new Error('permanent'))
            : Promise.resolve(value * 2),
        {
          concurrency: 2,
          shouldRetry: () => false,
          onDiscard,
        },
      ),
    ).rejects.toThrow('permanent')
    expect(onDiscard.mock.calls).toEqual([
      [2, 0],
      [6, 2],
    ])
  })
})
