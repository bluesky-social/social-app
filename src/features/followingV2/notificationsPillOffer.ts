import {type UnreadCheck} from '#/state/queries/notifications/types'

/**
 * Whether a Notifications list offers its "New" pill: the last unread check
 * found unread notifications the list has not loaded. Nothing here depends on
 * scroll position, and the caller still gates it on the tab being in view.
 *
 * "Not loaded" means newer than the newest notification the list has, which
 * leaves out unread rows already on screen, older unread rows the list has
 * not paged in yet, and rows marked unread only because `markAllRead` wrote
 * an older `seenAt` than the page it was marking.
 *
 * The pill goes away as soon as the list starts fetching its top, and stays
 * away once that fetch has loaded, because a check made before the list's
 * first page was requested has nothing to add to it. A failed fetch loads
 * nothing, so the offer comes back for a retry.
 */
export function isNotificationsPillOffered({
  filter,
  check,
  top,
}: {
  filter: 'all' | 'mentions'
  /** See `useLastUnreadCheck`. */
  check: UnreadCheck | undefined
  /** See `useNotificationFeedTop`. */
  top: {
    requestedAt: number | undefined
    newestAt: number | undefined
    isFetching: boolean
  }
}): boolean {
  /* The lists are already loading what this check found. */
  if (!check || check.loadsIntoFeed) return false
  /* Nothing loaded yet, or loading now: the list's own top is on its way. */
  if (top.isFetching || top.requestedAt === undefined) return false
  if (check.requestedAt <= top.requestedAt) return false
  const newestUnreadAt = check.newestUnreadAt[filter]
  if (newestUnreadAt === undefined) return false
  /* An empty list has loaded nothing for the unread notification to follow. */
  return top.newestAt === undefined || newestUnreadAt > top.newestAt
}
