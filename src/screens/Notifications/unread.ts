import {
  type GroupedNotificationsFeed,
  type GroupedNotificationsPeek,
  type LoadedGroupedNotificationsPage,
} from '#/state/queries/notifications/grouped'
import {type UnreadCheck} from '#/state/queries/notifications/types'

/**
 * A fresh load of the first page of a feed. Its `seenAt` is the server's, as
 * of the request.
 */
export type FeedLoad = Pick<
  LoadedGroupedNotificationsPage,
  'requestedAt' | 'newestAt' | 'seenAt'
> & {feed: GroupedNotificationsFeed}

/**
 * The screen's `seenAt` snapshot after a fresh load.
 *
 * A refresh takes it from the server's `seenAt` as of the request, which is
 * when the previous load marked everything it showed as seen. So what was
 * tinted before is cleared, and only what's new since is tinted, as every
 * refresh does in v1. Any other load, e.g. a tab's first, leaves it as it is,
 * so that tab tints the same as the others. Until there's a snapshot, every
 * load takes it from the server.
 */
export function nextSeenAt({
  load,
  isRefresh,
  snapshot,
}: {
  load: FeedLoad
  isRefresh: boolean
  snapshot: Date | undefined
}): Date | undefined {
  if (snapshot && !isRefresh) return snapshot
  // Without a `seenAt`, everything counts as seen, as in v1
  return new Date(parseTime(load.seenAt) ?? getShownUpTo(load))
}

/**
 * How far a fresh load marks notifications as seen on the server, if at all.
 *
 * Only "All" marks notifications as seen, as the other tabs leave things out.
 * It marks everything the load showed, and never moves the server's `seenAt`
 * backwards.
 */
export function getMarkReadAt(load: FeedLoad): Date | undefined {
  if (load.feed !== 'all') return
  return new Date(
    Math.max(getShownUpTo(load), parseTime(load.seenAt) ?? -Infinity),
  )
}

/**
 * Whether a tab offers its "Refresh" pill: it's the tab in view, and the last
 * unread check or the last peek at its feed found a notification it hasn't
 * loaded.
 *
 * The unread check only counts notifications that haven't been seen, for
 * every feed at once, while a peek looks at one feed, seen or not. So a peek
 * still finds what came in before a refresh on another tab marked it as seen.
 *
 * "Not loaded" means newer than the newest notification in the tab's first
 * page, so rows already on screen don't count. A check or peek asked before
 * that page was requested has nothing to add to it, so the pill goes as soon
 * as the tab starts fetching its top, and stays gone once that has loaded,
 * until a later check or peek finds more. A failed fetch loads nothing, so
 * the pill comes back for a retry.
 */
export function isRefreshPillVisible({
  feed,
  isActive,
  check,
  peek,
  top,
  isFetchingTop,
}: {
  feed: GroupedNotificationsFeed
  /**
   * Whether this is the tab in view, on the focused screen.
   */
  isActive: boolean
  check: UnreadCheck | undefined
  /**
   * The last peek at the tab's feed, see `peekGroupedNotifications`.
   */
  peek?: GroupedNotificationsPeek
  /**
   * The tab's first page, once loaded.
   */
  top:
    Pick<LoadedGroupedNotificationsPage, 'requestedAt' | 'newestAt'> | undefined
  /**
   * Whether the tab is fetching its first page, rather than a later one.
   */
  isFetchingTop: boolean
}): boolean {
  if (!isActive || !top || isFetchingTop) return false
  return (
    hasNewerThan(
      check && {
        requestedAt: check.requestedAt,
        newestAt: check.newestUnreadAt[feed],
      },
      top,
    ) || hasNewerThan(peek, top)
  )
}

/**
 * Whether something asked after `top` was requested found a notification
 * newer than any in it.
 */
function hasNewerThan(
  found: GroupedNotificationsPeek | undefined,
  top: Pick<LoadedGroupedNotificationsPage, 'requestedAt' | 'newestAt'>,
) {
  if (!found || found.requestedAt <= top.requestedAt) return false
  if (found.newestAt === undefined) return false
  return top.newestAt === undefined || found.newestAt > top.newestAt
}

/**
 * Up to when a load showed everything, in ms since the epoch. The request
 * time covers everything the page could hold, unless the server's clock is
 * ahead of ours, in which case its newest notification does.
 */
function getShownUpTo(load: FeedLoad) {
  return Math.max(load.requestedAt, load.newestAt ?? -Infinity)
}

function parseTime(datetime: string | undefined): number | undefined {
  const time = datetime ? Date.parse(datetime) : NaN
  return Number.isNaN(time) ? undefined : time
}
