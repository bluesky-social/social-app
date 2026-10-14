import {describe, expect, it, jest} from '@jest/globals'

import {until} from './until'

describe('until', () => {
  it('passes attempt errors to the condition', async () => {
    const error = new Error('failed')
    const fn = jest
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(error)
      .mockResolvedValue('ready')
    const cond = jest.fn((value: string | undefined) => value === 'ready')

    await expect(until(2, 0, cond, fn)).resolves.toBe(true)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(cond).toHaveBeenNthCalledWith(1, undefined, error)
    expect(cond).toHaveBeenNthCalledWith(2, 'ready', undefined)
  })

  it('returns false when every attempt rejects', async () => {
    const fn = jest
      .fn<() => Promise<string>>()
      .mockRejectedValue(new Error('failed'))
    const cond = jest.fn((_value: string | undefined) => false)

    await expect(until(2, 0, cond, fn)).resolves.toBe(false)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(cond).toHaveBeenCalledTimes(2)
  })

  it('can stop when an attempt rejects', async () => {
    const error = new Error('failed')
    const fn = jest.fn<() => Promise<string>>().mockRejectedValue(error)
    const cond = jest.fn(
      (_value: string | undefined, err: unknown) => err === error,
    )

    await expect(until(2, 0, cond, fn)).resolves.toBe(true)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(cond).toHaveBeenCalledWith(undefined, error)
  })
})
