import {
  type GroupedNotificationsFeed,
  type LoadedGroupedNotificationsPage,
} from '#/state/queries/notifications/grouped'
import {type UnreadCheck} from '#/state/queries/notifications/types'

/**
 * How a load updates the screen's `seenAt` snapshot:
 *
 * - `server`: from the server's `seenAt` as of the request, which is when the
 *   previous load marked everything it showed as seen. So anything new since
 *   then is tinted, and anything older isn't. This is what pull-to-refresh
 *   does, as in v1.
 * - `kept`: unchanged, so rows that were already tinted stay tinted, and
 *   anything new is tinted alongside them.
 *
 * Until there's a snapshot, every load takes it from the server.
 */
export type SeenAtMode = 'server' | 'kept'

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
 */
export function nextSeenAt({
  load,
  mode,
  snapshot,
}: {
  load: FeedLoad
  /**
   * How the load was asked to update the snapshot. Undefined leaves it as it
   * is, like `kept`.
   */
  mode: SeenAtMode | undefined
  snapshot: Date | undefined
}): Date | undefined {
  switch (snapshot === undefined ? 'server' : mode) {
    case 'server':
      // Without a `seenAt`, everything counts as seen, as in v1
      return new Date(parseTime(load.seenAt) ?? getShownUpTo(load))
    default:
      return snapshot
  }
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
 * unread check found unread notifications for its feed that it hasn't
 * loaded.
 *
 * "Not loaded" means newer than the newest notification in the tab's first
 * page, so unread rows already on screen don't count. A check asked before
 * that page was requested has nothing to add to it, so the pill goes as soon
 * as the tab starts fetching its top, and stays gone once that has loaded,
 * until a later check finds more. A failed fetch loads nothing, so the pill
 * comes back for a retry.
 */
export function isRefreshPillVisible({
  feed,
  isActive,
  check,
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
   * The tab's first page, once loaded.
   */
  top:
    Pick<LoadedGroupedNotificationsPage, 'requestedAt' | 'newestAt'> | undefined
  /**
   * Whether the tab is fetching its first page, rather than a later one.
   */
  isFetchingTop: boolean
}): boolean {
  if (!isActive || !check || !top || isFetchingTop) return false
  if (check.requestedAt <= top.requestedAt) return false
  const newestUnreadAt = check.newestUnreadAt[feed]
  if (newestUnreadAt === undefined) return false
  return top.newestAt === undefined || newestUnreadAt > top.newestAt
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
