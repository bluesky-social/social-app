const FIRST_QUALITY = 90
const MIN_QUALITY = 25
const MAX_QUALITY = 100
const MAX_ENCODES = 6
/** Stop once a result that fits uses at least this much of the budget. */
const GOOD_ENOUGH_RATIO = 0.9
/** Interpolation aims here, inside the good-enough range. */
const TARGET_RATIO = 0.95

export type QualityFit<Payload> = {
  quality: number
  size: number
  payload: Payload
}

/**
 * Picks JPEG qualities (1-100) to try until it has close to the highest one
 * whose output fits in `maxBytes`. Call `nextQuality()`, encode at that quality
 * and `record` the result, until `nextQuality()` returns null. Then `best` is
 * the result to use, or null if nothing fit.
 *
 * Kept in sync with QualitySearch.swift and QualitySearch.kt in
 * expo-bluesky-image-compressor, whose README describes the strategy.
 */
export class QualitySearch<Payload> {
  best: QualityFit<Payload> | null = null
  private tooBig: {quality: number; size: number} | null = null
  private encodes = 0
  private done = false

  constructor(readonly maxBytes: number) {}

  nextQuality(): number | null {
    if (this.done || this.encodes >= MAX_ENCODES) {
      return null
    }
    if (!this.tooBig) {
      // Nothing too big yet: start at the first guess, or try the top.
      if (this.best) {
        return this.best.quality < MAX_QUALITY ? MAX_QUALITY : null
      }
      return FIRST_QUALITY
    }
    if (!this.best) {
      // The first guess was too big. Check the floor before searching.
      return this.tooBig.quality > MIN_QUALITY ? MIN_QUALITY : null
    }
    if (this.tooBig.quality - this.best.quality <= 1) {
      return null
    }
    return this.interpolate(this.best, this.tooBig)
  }

  record(quality: number, size: number, payload: Payload) {
    this.encodes++
    if (size <= this.maxBytes) {
      this.best = {quality, size, payload}
      if (quality >= MAX_QUALITY || size >= this.maxBytes * GOOD_ENOUGH_RATIO) {
        this.done = true
      }
    } else {
      this.tooBig = {quality, size}
    }
  }

  /**
   * Assumes size grows exponentially with quality, which is close enough to
   * land near the target in a step or two. Always returns a quality strictly
   * between the two bounds, so the search narrows every time.
   */
  private interpolate(
    fit: {quality: number; size: number},
    miss: {quality: number; size: number},
  ): number {
    const target = Math.log(this.maxBytes * TARGET_RATIO)
    const low = Math.log(Math.max(fit.size, 1))
    const high = Math.log(miss.size)
    const fraction =
      high > low ? Math.min(Math.max((target - low) / (high - low), 0), 1) : 0.5
    const quality = Math.round(
      fit.quality + fraction * (miss.quality - fit.quality),
    )
    return Math.min(Math.max(quality, fit.quality + 1), miss.quality - 1)
  }
}
