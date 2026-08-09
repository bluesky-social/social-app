/**
 * Whether the player is on screen, or whether that cannot currently be known.
 *
 * `indeterminate` is not a failure to measure - it means the measurement and
 * the window dimensions describe different layouts, so no comparison between
 * them is meaningful. Callers must not treat it as `hidden`.
 */
export type PlayerVisibility = 'visible' | 'hidden' | 'indeterminate'

/**
 * Slack in dp allowed on the width comparison below. Layout rounding can leave
 * a full-bleed view a fraction wider than the window it sits in without the
 * two being out of sync.
 */
const WIDTH_OVERFLOW_TOLERANCE = 1

/**
 * Decide whether the player is on screen, given a measurement of the player
 * and the window box to compare it against. Both must describe the same
 * layout; when they demonstrably do not, the answer is `indeterminate`.
 */
export function getPlayerVisibility({
  player,
  window,
  insets,
}: {
  player: {top: number; height: number; width: number}
  window: {width: number; height: number}
  insets: {top: number; bottom: number}
}): PlayerVisibility {
  'worklet'

  /*
   * On rotation the native view tree re-lays out for the new orientation
   * several frames before useWindowDimensions() reports the change, so for
   * those frames the two arguments describe different orientations. A view
   * cannot be wider than the window containing it, so a width overflow is
   * proof that they disagree - and the position comparison below would be
   * comparing coordinates from two different layouts.
   */
  if (player.width - window.width > WIDTH_OVERFLOW_TOLERANCE) {
    return 'indeterminate'
  }

  const top = player.top
  const bottom = player.top + player.height
  const isOnScreen =
    top <= window.height - insets.bottom && bottom >= insets.top

  return isOnScreen ? 'visible' : 'hidden'
}
