package expo.modules.blueskyimagecompressor

import kotlin.math.ln
import kotlin.math.roundToInt

/**
 * Picks JPEG qualities to try until it has close to the highest one whose
 * output fits in [maxBytes]. Call [nextQuality], encode at that quality and
 * [record] the result, until [nextQuality] returns null. Then [best] is the
 * result to use, or null if nothing fit.
 *
 * Kept in sync with QualitySearch.swift and
 * src/lib/media/image/qualitySearch.ts, which has the tests. See the README
 * for the strategy.
 */
internal class QualitySearch<Payload>(
  private val maxBytes: Int,
) {
  class Fit<Payload>(
    val quality: Int,
    val size: Int,
    val payload: Payload,
  )

  private class Miss(
    val quality: Int,
    val size: Int,
  )

  var best: Fit<Payload>? = null
    private set
  private var tooBig: Miss? = null
  private var encodes = 0
  private var done = false

  fun nextQuality(): Int? {
    if (done || encodes >= MAX_ENCODES) {
      return null
    }
    val tooBig = tooBig
    val best = best
    if (tooBig == null) {
      // Nothing too big yet: start at the first guess, or try the top.
      if (best != null) {
        return if (best.quality < MAX_QUALITY) MAX_QUALITY else null
      }
      return FIRST_QUALITY
    }
    if (best == null) {
      // The first guess was too big. Check the floor before searching.
      return if (tooBig.quality > MIN_QUALITY) MIN_QUALITY else null
    }
    if (tooBig.quality - best.quality <= 1) {
      return null
    }
    return interpolate(best, tooBig)
  }

  /** [payload] is only called if the result fits. */
  fun record(
    quality: Int,
    size: Int,
    payload: () -> Payload,
  ) {
    encodes++
    if (size <= maxBytes) {
      best = Fit(quality, size, payload())
      if (quality >= MAX_QUALITY || size >= maxBytes * GOOD_ENOUGH_RATIO) {
        done = true
      }
    } else {
      tooBig = Miss(quality, size)
    }
  }

  /**
   * Assumes size grows exponentially with quality, which is close enough to
   * land near the target in a step or two. Always returns a quality strictly
   * between the two bounds, so the search narrows every time.
   */
  private fun interpolate(
    fit: Fit<Payload>,
    miss: Miss,
  ): Int {
    val target = ln(maxBytes * TARGET_RATIO)
    val low = ln(maxOf(fit.size, 1).toDouble())
    val high = ln(miss.size.toDouble())
    val fraction = if (high > low) ((target - low) / (high - low)).coerceIn(0.0, 1.0) else 0.5
    val quality = fit.quality + fraction * (miss.quality - fit.quality)
    return quality.roundToInt().coerceIn(fit.quality + 1, miss.quality - 1)
  }

  companion object {
    const val FIRST_QUALITY = 90
    const val MIN_QUALITY = 25
    const val MAX_QUALITY = 100
    const val MAX_ENCODES = 6

    /** Stop once a result that fits uses at least this much of the budget. */
    const val GOOD_ENOUGH_RATIO = 0.9

    /** Interpolation aims here, inside the good-enough range. */
    const val TARGET_RATIO = 0.95
  }
}
