import {describe, expect, it} from '@jest/globals'

import {buildProfileRow, GERM_KEY, reorderLinks} from './row'

const a = {url: 'https://a.example'}
const b = {url: 'https://b.example'}

describe('buildProfileRow', () => {
  it('puts the Germ button after the links', () => {
    expect(buildProfileRow([a, b], true).map(item => item.key)).toEqual([
      a.url,
      b.url,
      GERM_KEY,
    ])
  })

  it('leaves Germ out when the account has no button', () => {
    expect(buildProfileRow([a], false).map(item => item.key)).toEqual([a.url])
  })
})

describe('reorderLinks', () => {
  it('orders links by key, ignoring unknown keys', () => {
    expect(reorderLinks([b.url, GERM_KEY, a.url], [a, b])).toEqual([b, a])
  })
})
