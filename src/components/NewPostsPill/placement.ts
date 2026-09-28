import {pagerHeaderCollapseTranslateY} from '#/view/com/pager/pagerHeaderCollapse'
import {homeHeaderCollapseTranslateY} from '#/view/com/util/homeHeaderCollapse'

/** Space between the effective bottom edge of the header and the pill. */
export const NEW_POSTS_PILL_HEADER_GAP = 16

/**
 * Where the bottom edge of the Home header is, measured from the top of the
 * Home pager: the whole header when expanded, and only its pinned strip once
 * collapsed.
 *
 * @platform ios, android
 */
export function homeHeaderBottom({
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
  return (
    headerHeight +
    homeHeaderCollapseTranslateY({mode, headerHeight, pinnedHeight})
  )
}

/**
 * Where the bottom edge of a `PagerWithHeader` header, tab bar included, is,
 * measured from the top of a page. The tab bar never leaves, so this comes to
 * rest beneath it once the header above has collapsed.
 *
 * @platform ios, android
 */
export function pagerHeaderBottom({
  headerHeight,
  scrollY,
  headerOnlyHeight,
  minimumHeaderHeight,
  allowHeaderOverScroll = false,
}: {
  /** The whole header, tab bar included: the page's `headerHeight`. */
  headerHeight: number
  /** The focused page's scroll offset. */
  scrollY: number
  /** Height of the header above the tab bar, which is what collapses. */
  headerOnlyHeight: number
  /** How much of the header above the tab bar stays on screen regardless. */
  minimumHeaderHeight: number
  /** Whether the header follows a rubber band past the top of the list. */
  allowHeaderOverScroll?: boolean
}): number {
  'worklet'
  return (
    headerHeight +
    pagerHeaderCollapseTranslateY({
      scrollY,
      headerOnlyHeight,
      minimumHeaderHeight,
      allowHeaderOverScroll,
    })
  )
}
