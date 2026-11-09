import Foundation

/**
 Picks JPEG qualities to try until it has close to the highest one whose output
 fits in `maxBytes`. Call `nextQuality()`, encode at that quality and `record`
 the result, until `nextQuality()` returns nil. Then `best` is the result to
 use, or nil if nothing fit.

 Kept in sync with QualitySearch.kt and src/lib/media/image/qualitySearch.ts,
 which has the tests. See the README for the strategy.
 */
struct QualitySearch<Payload> {
  static var firstQuality: Int { 90 }
  static var minQuality: Int { 25 }
  static var maxQuality: Int { 100 }
  static var maxEncodes: Int { 6 }
  /** Stop once a result that fits uses at least this much of the budget. */
  static var goodEnoughRatio: Double { 0.9 }
  /** Interpolation aims here, inside the good-enough range. */
  static var targetRatio: Double { 0.95 }

  struct Fit {
    let quality: Int
    let size: Int
    let payload: Payload
  }

  private struct Miss {
    let quality: Int
    let size: Int
  }

  let maxBytes: Int
  private(set) var best: Fit?
  private var tooBig: Miss?
  private var encodes = 0
  private var done = false

  init(maxBytes: Int) {
    self.maxBytes = maxBytes
  }

  func nextQuality() -> Int? {
    if done || encodes >= Self.maxEncodes {
      return nil
    }
    guard let tooBig else {
      // Nothing too big yet: start at the first guess, or try the top.
      if let best {
        return best.quality < Self.maxQuality ? Self.maxQuality : nil
      }
      return Self.firstQuality
    }
    guard let best else {
      // The first guess was too big. Check the floor before searching.
      return tooBig.quality > Self.minQuality ? Self.minQuality : nil
    }
    if tooBig.quality - best.quality <= 1 {
      return nil
    }
    return interpolate(between: best, and: tooBig)
  }

  /** `payload` is only called if the result fits. */
  mutating func record(quality: Int, size: Int, payload: () -> Payload) {
    encodes += 1
    if size <= maxBytes {
      best = Fit(quality: quality, size: size, payload: payload())
      if quality >= Self.maxQuality || Double(size) >= Double(maxBytes) * Self.goodEnoughRatio {
        done = true
      }
    } else {
      tooBig = Miss(quality: quality, size: size)
    }
  }

  /**
   Assumes size grows exponentially with quality, which is close enough to
   land near the target in a step or two. Always returns a quality strictly
   between the two bounds, so the search narrows every time.
   */
  private func interpolate(between fit: Fit, and miss: Miss) -> Int {
    let target = log(Double(maxBytes) * Self.targetRatio)
    let low = log(Double(max(fit.size, 1)))
    let high = log(Double(miss.size))
    let fraction = high > low ? min(max((target - low) / (high - low), 0), 1) : 0.5
    let quality = Double(fit.quality) + fraction * Double(miss.quality - fit.quality)
    return min(max(Int(quality.rounded()), fit.quality + 1), miss.quality - 1)
  }
}
