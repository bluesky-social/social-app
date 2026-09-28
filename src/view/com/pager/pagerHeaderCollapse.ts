/**
 * How far the pager header has slid up, in points, at a given scroll offset:
 * 0 or negative, unless over-scroll is allowed, when a rubber band at the top
 * of the list carries the header down with it.
 *
 * Only the part above the tab bar collapses, and it keeps
 * `minimumHeaderHeight` of itself on screen, so the most it can travel is
 * `headerOnlyHeight - minimumHeaderHeight`.
 *
 * The header translates by this (see `PagerTabBar`), and anything that hangs
 * beneath it reads the same value, so the two cannot drift apart.
 *
 * @platform ios, android
 */
export function pagerHeaderCollapseTranslateY({
  scrollY,
  headerOnlyHeight,
  minimumHeaderHeight,
  allowHeaderOverScroll = false,
}: {
  /** The focused page's scroll offset. */
  scrollY: number
  /** Height of the header above the tab bar. */
  headerOnlyHeight: number
  /** How much of that header stays on screen once collapsed. */
  minimumHeaderHeight: number
  /** Whether the header follows a rubber band past the top of the list. */
  allowHeaderOverScroll?: boolean
}): number {
  'worklet'
  const translateY =
    Math.min(scrollY, Math.max(headerOnlyHeight - minimumHeaderHeight, 0)) * -1
  return allowHeaderOverScroll ? translateY : Math.min(translateY, 0)
}
