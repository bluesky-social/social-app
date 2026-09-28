/**
 * How far the Home header has slid up, in points, at a collapse progress
 * between 0 (expanded) and 1 (collapsed). It stops once only `pinnedHeight` of
 * it is left on screen: the status bar strip under liquid glass, nothing
 * elsewhere.
 *
 * The header translates by this (see `useHomeHeaderTransform`), and anything
 * that hangs beneath it reads the same value, so the two cannot drift apart.
 */
export function homeHeaderCollapseTranslateY({
  mode,
  headerHeight,
  pinnedHeight,
}: {
  /** The Home header mode shared value: 0 expanded, 1 collapsed. */
  mode: number
  /** Measured height of the whole header, tab bar included. */
  headerHeight: number
  /** Height of the header that stays on screen once collapsed. */
  pinnedHeight: number
}): number {
  'worklet'
  return mode * (pinnedHeight - headerHeight)
}
