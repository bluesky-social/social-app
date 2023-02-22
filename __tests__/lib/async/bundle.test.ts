import {bundleAsync} from '../../../src/lib/async/bundle'

describe('bundle', () => {
  it('bundles multiple simultaneous calls into one execution', async () => {
    let calls = 0
    const fn = bundleAsync(async () => {
      calls++
      await new Promise(r => setTimeout(r, 1))
      return 'hello'
    })
    const [res1, res2, res3] = await Promise.all([fn(), fn(), fn()])
    expect(calls).toEqual(1)
    expect(res1).toEqual('hello')
    expect(res2).toEqual('hello')
    expect(res3).toEqual('hello')
  })
  it('does not bundle non-simultaneous calls', async () => {
    let calls = 0
    const fn = bundleAsync(async () => {
      calls++
      await new Promise(r => setTimeout(r, 1))
      return 'hello'
    })
    const res1 = await fn()
    const res2 = await fn()
    const res3 = await fn()
    expect(calls).toEqual(3)
    expect(res1).toEqual('hello')
    expect(res2).toEqual('hello')
    expect(res3).toEqual('hello')
  })
  it('is not affected by rejections', async () => {
    let calls = 0
    const fn = bundleAsync(async () => {
      calls++
      await new Promise(r => setTimeout(r, 1))
      throw new Error()
    })
    const res1 = await fn().catch(() => 'reject')
    const res2 = await fn().catch(() => 'reject')
    const res3 = await fn().catch(() => 'reject')
    expect(calls).toEqual(3)
    expect(res1).toEqual('reject')
    expect(res2).toEqual('reject')
    expect(res3).toEqual('reject')
  })
})
