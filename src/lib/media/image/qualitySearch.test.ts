import {describe, expect, it} from '@jest/globals'

import {QualitySearch} from '#/lib/media/image/qualitySearch'

const MAX_BYTES = 2_000_000

/** Runs a search against a fake encoder and returns what it tried. */
function run(sizeAt: (quality: number) => number, maxBytes = MAX_BYTES) {
  const search = new QualitySearch<number>(maxBytes)
  const tried: number[] = []
  for (
    let quality = search.nextQuality();
    quality !== null;
    quality = search.nextQuality()
  ) {
    tried.push(quality)
    search.record(quality, sizeAt(quality), quality)
  }
  return {best: search.best, tried}
}

/** JPEG size grows roughly exponentially with quality. */
function exponential(sizeAt25: number, sizeAt100: number) {
  const growth = Math.log(sizeAt100 / sizeAt25) / 75
  return (quality: number) =>
    Math.round(sizeAt25 * Math.exp(growth * (quality - 25)))
}

describe('QualitySearch', () => {
  it('stops at the first guess when it is close enough to the budget', () => {
    const {best, tried} = run(() => MAX_BYTES * 0.95)
    expect(tried).toEqual([90])
    expect(best?.quality).toBe(90)
  })

  it('tries the top quality when the first guess is well under budget', () => {
    const {best, tried} = run(exponential(100_000, 500_000))
    expect(tried).toEqual([90, 100])
    expect(best?.quality).toBe(100)
  })

  it('checks the floor and gives up when even the floor is too big', () => {
    const {best, tried} = run(() => MAX_BYTES + 1)
    expect(tried).toEqual([90, 25])
    expect(best).toBeNull()
  })

  it('searches between the floor and the first guess', () => {
    const {best, tried} = run(exponential(800_000, 8_000_000))
    expect(tried.slice(0, 2)).toEqual([90, 25])
    expect(best!.size).toBeLessThanOrEqual(MAX_BYTES)
    expect(best!.size).toBeGreaterThanOrEqual(MAX_BYTES * 0.9)
    expect(tried.length).toBeLessThanOrEqual(4)
  })

  it('stops when the bounds are one apart', () => {
    // Size jumps from well under to well over the budget between 60 and 61.
    const {best, tried} = run(q => (q <= 60 ? 1_000_000 : 3_000_000))
    expect(best?.quality).toBe(60)
    expect(new Set(tried).size).toBe(tried.length)
    expect(tried.length).toBeLessThanOrEqual(6)
  })

  it('always fits, never repeats a quality and encodes at most 6 times', () => {
    for (let sizeAt25 = 50_000; sizeAt25 <= 3_000_000; sizeAt25 *= 1.37) {
      for (const ratio of [2, 4, 8, 16, 40]) {
        const sizeAt = exponential(sizeAt25, sizeAt25 * ratio)
        const {best, tried} = run(sizeAt)

        expect(tried.length).toBeLessThanOrEqual(6)
        expect(new Set(tried).size).toBe(tried.length)
        expect(tried.every(q => q >= 25 && q <= 100)).toBe(true)

        if (sizeAt(25) > MAX_BYTES) {
          expect(best).toBeNull()
          continue
        }
        expect(best!.size).toBeLessThanOrEqual(MAX_BYTES)
        // The best quality that fits, found by trying all of them.
        let optimum = 25
        for (let q = 25; q <= 100; q++) {
          if (sizeAt(q) <= MAX_BYTES) optimum = q
        }
        const closeEnough =
          best!.size >= MAX_BYTES * 0.9 ||
          best!.quality === optimum ||
          tried.length === 6
        expect(closeEnough).toBe(true)
      }
    }
  })
})
