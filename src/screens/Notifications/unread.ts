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
 * A time per feed, in ms since the epoch, for the feeds it's known for.
 */
export type FeedTimes = Partial<Record<GroupedNotificationsFeed, number>>

/**
 * Which tabs' pills show that the tab has unread notifications the user
 * hasn't seen in it, so they know to switch to it. Also returns how far each
 * tab has been seen in, to keep for next time.
 *
 * A tab's newest notification is the newest of:
 *
 * - what its latest fresh load found, if it has loaded, and
 * - what the last unread check found for its feed, read or not. This covers
 *   tabs that have never loaded, and anything since a tab last loaded.
 *
 * A tab other than the one in view has unread notifications when its newest
 * one is newer than both:
 *
 * - The screen's `seenAt` snapshot, so the pill agrees with the unread tint:
 *   switching to the tab shows that notification tinted. The Followers tab
 *   has no tint, but counts new followers the same way. Pull-to-refresh moves
 *   the snapshot on, so older notifications stop counting as they stop being
 *   tinted. Until there's a snapshot nothing counts.
 * - The newest notification the tab knew of while it was in view. Switching
 *   to a tab clears it, along with anything its "Refresh" pill offered while
 *   it was in view, and it only comes back for notifications that arrive
 *   after.
 */
export function getUnreadTabs({
  feeds,
  activeFeed,
  check,
  loadedNewestAt,
  seenAt,
  seenUpTo,
}: {
  feeds: GroupedNotificationsFeed[]
  /**
   * The feed of the tab in view.
   */
  activeFeed: GroupedNotificationsFeed
  check: UnreadCheck | undefined
  /**
   * The newest notification each feed's latest fresh load found, if it has
   * loaded.
   */
  loadedNewestAt: FeedTimes
  seenAt: Date | undefined
  /**
   * The newest notification each tab knew of while it was in view, as
   * returned last time.
   */
  seenUpTo: FeedTimes
}): {
  unreadTabs: Set<GroupedNotificationsFeed>
  /**
   * The same object as was passed in when nothing has changed, so it can be
   * kept in state.
   */
  seenUpTo: FeedTimes
} {
  const getNewestAt = (feed: GroupedNotificationsFeed) => {
    const loaded = loadedNewestAt[feed]
    const checked = check?.newestAt[feed]
    if (loaded === undefined) return checked
    if (checked === undefined) return loaded
    return Math.max(loaded, checked)
  }

  let nextSeenUpTo = seenUpTo
  const activeNewestAt = getNewestAt(activeFeed)
  if (
    activeNewestAt !== undefined &&
    activeNewestAt > (seenUpTo[activeFeed] ?? -Infinity)
  ) {
    nextSeenUpTo = {...seenUpTo, [activeFeed]: activeNewestAt}
  }

  const unreadTabs = new Set<GroupedNotificationsFeed>()
  if (seenAt) {
    for (const feed of feeds) {
      if (feed === activeFeed) continue
      const newestAt = getNewestAt(feed)
      const readUpTo = Math.max(
        seenAt.getTime(),
        nextSeenUpTo[feed] ?? -Infinity,
      )
      if (newestAt !== undefined && newestAt > readUpTo) {
        unreadTabs.add(feed)
      }
    }
  }
  return {unreadTabs, seenUpTo: nextSeenUpTo}
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
