/**
 * How long after a tab pill is tapped the pager selecting its page still
 * counts as the tap's doing. On iOS the pager reports the page once it has
 * animated there.
 */
const TAP_WINDOW_MS = 2000

/**
 * Tells tab pill taps apart from swipes, as both end in the pager selecting a
 * page. Pills tapped in quick succession can have several on the way, and
 * the pager may skip straight to the last, so a tap only counts for a short
 * while: one whose page was skipped can't make a later swipe there look like
 * a tap.
 */
export function createTabTaps() {
  const tappedAt = new Map<number, number>()
  return {
    tap(page: number, now = Date.now()) {
      tappedAt.set(page, now)
    },
    /**
     * Whether the pager selecting `page` was down to a tap.
     */
    take(page: number, now = Date.now()) {
      const at = tappedAt.get(page)
      tappedAt.delete(page)
      return at !== undefined && now - at <= TAP_WINDOW_MS
    },
  }
}
