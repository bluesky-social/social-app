import {describe, expect, it} from '@jest/globals'

import {createInitialRows, prependRows, rowHeight} from './data'

describe('prepend lab data', () => {
  it('is a pure function of the seed', () => {
    const a = createInitialRows({seed: 1, count: 50, leadingRows: 1})
    const b = createInitialRows({seed: 1, count: 50, leadingRows: 1})
    const c = createInitialRows({seed: 2, count: 50, leadingRows: 1})
    expect(a).toEqual(b)
    expect(a.map(r => r.height)).not.toEqual(c.map(r => r.height))
  })

  it('prepends newer rows below the leading rows, newest first', () => {
    const initial = createInitialRows({seed: 1, count: 5, leadingRows: 2})
    const once = prependRows(initial, {seed: 1, count: 3, profile: 'mixed'})
    const twice = prependRows(once, {seed: 1, count: 2, profile: 'short'})

    expect(twice.slice(0, 2).map(r => r.kind)).toEqual(['leading', 'leading'])
    expect(twice.slice(2, 7).map(r => r.seq)).toEqual([
      1005, 1004, 1003, 1002, 1001,
    ])
    expect(twice.slice(2, 7).map(r => r.batch)).toEqual([2, 2, 1, 1, 1])
    // Existing rows keep their identity, which is what makes this a prepend.
    expect(twice.slice(7)).toEqual(initial.slice(2))
    expect(twice.slice(4, 7)).toEqual(once.slice(2, 5))
    expect(new Set(twice.map(r => r.id)).size).toBe(twice.length)
  })

  it('keeps each profile in its range', () => {
    for (let seq = 0; seq < 500; seq++) {
      const short = rowHeight(3, seq, 'short')
      const tall = rowHeight(3, seq, 'tall')
      const mixed = rowHeight(3, seq, 'mixed')
      expect(short).toBeGreaterThanOrEqual(64)
      expect(short).toBeLessThanOrEqual(120)
      expect(tall).toBeGreaterThanOrEqual(600)
      expect(tall).toBeLessThanOrEqual(1400)
      expect(mixed).toBeGreaterThanOrEqual(80)
      expect(mixed).toBeLessThanOrEqual(2000)
    }
  })
})
