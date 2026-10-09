/**
 * `indeterminate` means the measurement and the window describe different
 * layouts, so no comparison is meaningful. Callers must not treat it as
 * `hidden`.
 */
export type PlayerVisibility = 'visible' | 'hidden' | 'indeterminate'

/** Layout rounding can leave a full-bleed view a fraction wider than the window. */
const WIDTH_OVERFLOW_TOLERANCE = 1

/**
 * Decide whether the player is on screen, given a measurement of the player
 * and the window to compare it against. Both must describe the same layout;
 * when they demonstrably do not, the answer is `indeterminate`.
 *
 * Only a player wider than the window is detected as a mismatch (portrait to
 * landscape). The reverse cannot be told apart from a narrow player.
 */
export function getPlayerVisibility({
  player,
  viewport,
  isNative,
  insets,
}: {
  player: {top: number; height: number; width: number}
  /** The window dimensions, as reported by `useWindowDimensions()`. */
  viewport: {width: number; height: number}
  /**
   * On native the window can report the old orientation for several frames
   * after a rotation, so the longer side bounds the bottom edge. On web the
   * window height is exact.
   */
  isNative: boolean
  insets: {top: number; bottom: number}
}): PlayerVisibility {
  'worklet'

  const measurements = [
    player.top,
    player.height,
    player.width,
    viewport.width,
    viewport.height,
    insets.top,
    insets.bottom,
  ]
  // NaN compares false either way, which would read as `hidden`.
  if (!measurements.every(Number.isFinite)) {
    return 'indeterminate'
  }

  // Not laid out yet (or collapsed): the position says nothing about the screen.
  if (player.height <= 0 || viewport.width <= 0 || viewport.height <= 0) {
    return 'indeterminate'
  }

  /*
   * On rotation the native view tree re-lays out for the new orientation
   * several frames before useWindowDimensions() reports the change, so for
   * those frames the two arguments describe different orientations. A view
   * cannot be wider than the window containing it, so a width overflow is
   * proof that they disagree - and the position comparison below would be
   * comparing coordinates from two different layouts.
   */
  if (player.width - viewport.width > WIDTH_OVERFLOW_TOLERANCE) {
    return 'indeterminate'
  }

  const viewportBottom = isNative
    ? Math.max(viewport.width, viewport.height)
    : viewport.height
  const top = player.top
  const bottom = player.top + player.height
  const isOnScreen =
    top <= viewportBottom - insets.bottom && bottom >= insets.top

  return isOnScreen ? 'visible' : 'hidden'
}
