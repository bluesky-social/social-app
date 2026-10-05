import {describe, expect, it} from '@jest/globals'

import {applyRowOrder, buildProfileRow, GERM_KEY, removeLinkAt} from './row'

const a = {url: 'https://a.example'}
const b = {url: 'https://b.example'}
const c = {url: 'https://c.example'}

describe('buildProfileRow', () => {
  it('slots the Germ button in at its position', () => {
    expect(buildProfileRow([a, b], true, 1).map(item => item.key)).toEqual([
      a.url,
      GERM_KEY,
      b.url,
    ])
  })

  it('clamps a position past the end', () => {
    expect(buildProfileRow([a], true, 5).map(item => item.key)).toEqual([
      a.url,
      GERM_KEY,
    ])
  })

  it('leaves Germ out when the account has none', () => {
    expect(buildProfileRow([a, b], false, 1).map(item => item.key)).toEqual([
      a.url,
      b.url,
    ])
  })
})

describe('applyRowOrder', () => {
  it('reorders links and records where Germ landed', () => {
    expect(applyRowOrder([GERM_KEY, b.url, a.url], [a, b], 1)).toEqual({
      links: [b, a],
      germIndex: 0,
    })
  })

  it('keeps the saved Germ position when Germ is not in the row', () => {
    expect(applyRowOrder([b.url, a.url], [a, b], 2)).toEqual({
      links: [b, a],
      germIndex: 2,
    })
  })
})

describe('removeLinkAt', () => {
  it('keeps Germ after the same link when an earlier link goes', () => {
    // row: a, Germ, b, c -> removing a leaves Germ first, before b
    expect(removeLinkAt([a, b, c], 1, 0)).toEqual({
      links: [b, c],
      germIndex: 0,
    })
  })

  it('leaves Germ alone when a later link goes', () => {
    expect(removeLinkAt([a, b, c], 1, 2)).toEqual({
      links: [a, b],
      germIndex: 1,
    })
  })
})
