import {isRetryableRequestError} from '#/lib/async/retry'

describe('retry', () => {
  it('identifies retryable request errors', () => {
    expect(isRetryableRequestError(new TypeError('Failed to fetch'))).toBe(true)
    expect(isRetryableRequestError(new Error('Invalid request'))).toBe(false)
  })
})
