import {LikelyType, getLikelyType} from '../../src/lib/link-meta/link-meta'

describe('getLikelyType', () => {
  it('correctly handles non-parsed url', async () => {
    const output = await getLikelyType('https://example.com')
    expect(output).toEqual(LikelyType.HTML)
  })

  it('handles non-string urls without crashing', async () => {
    const output = await getLikelyType('123')
    expect(output).toEqual(LikelyType.Other)
  })
})
