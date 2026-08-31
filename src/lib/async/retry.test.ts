import {exponentialBackoffRetryDelay, retry} from '#/lib/async/retry'

describe('retry', () => {
  it('calculates capped exponential backoff delays', () => {
    expect([0, 1, 2, 3, 10].map(exponentialBackoffRetryDelay)).toEqual([
      1000, 2000, 4000, 8000, 30_000,
    ])
  })

  it('applies the delay between attempts, but not after the last one', async () => {
    const action = jest
      .fn<Promise<string>, []>()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValue('ok')
    const delay = jest.fn(() => 0)

    await expect(retry(3, () => true, action, delay)).resolves.toBe('ok')
    expect(delay.mock.calls).toEqual([[0], [1]])
  })
})
