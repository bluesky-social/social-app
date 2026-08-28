import {describe, expect, it, jest} from '@jest/globals'

import {until} from './until'

describe('until', () => {
  it('does not invoke the condition when an attempt rejects', async () => {
    const fn = jest
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('failed'))
      .mockResolvedValue('ready')
    const cond = jest.fn((value: string) => value === 'ready')

    await expect(until(2, 0, cond, fn)).resolves.toBe(true)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(cond).toHaveBeenCalledTimes(1)
    expect(cond).toHaveBeenCalledWith('ready')
  })

  it('returns false when every attempt rejects', async () => {
    const fn = jest
      .fn<() => Promise<string>>()
      .mockRejectedValue(new Error('failed'))
    const cond = jest.fn((_value: string) => true)

    await expect(until(2, 0, cond, fn)).resolves.toBe(false)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(cond).not.toHaveBeenCalled()
  })
})
