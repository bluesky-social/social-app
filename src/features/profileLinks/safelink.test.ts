import {afterEach, describe, expect, it, jest} from '@jest/globals'

import {checkSafelink} from './safelink'

const respond = (body: unknown, ok = true) =>
  jest
    .spyOn(global, 'fetch')
    .mockResolvedValue({ok, json: () => Promise.resolve(body)} as Response)

describe('checkSafelink', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns the rule action for the URL', async () => {
    const fetch = respond({action: 'block'})
    await expect(checkSafelink('https://scam.com/x')).resolves.toBe('block')
    expect(fetch).toHaveBeenCalledWith(
      'https://go.bsky.app/safelink/check?u=https%3A%2F%2Fscam.com%2Fx',
      expect.anything(),
    )
  })

  it('treats unknown actions as no rule', async () => {
    respond({action: 'something-new'})
    await expect(checkSafelink('https://example.com')).resolves.toBe('none')
  })

  it('fails open when the check is unavailable', async () => {
    respond({}, false)
    await expect(checkSafelink('https://example.com')).resolves.toBe('none')
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('offline'))
    await expect(checkSafelink('https://example.com')).resolves.toBe('none')
  })
})
