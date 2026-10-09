import {
  type GroupedNotificationsFeed,
  type LoadedGroupedNotificationsPage,
} from '#/state/queries/notifications/grouped'

/**
 * How a load updates the screen's `seenAt` snapshot:
 *
 * - `server`: from the server's `seenAt`, so anything new since the last
 *   visit is tinted.
 * - `cleared`: up to what the load showed, so everything shown counts as
 *   seen. This is what pull-to-refresh does.
 * - `kept`: unchanged, so rows that were already tinted stay tinted, and
 *   anything new is tinted alongside them.
 *
 * Until there's a snapshot, every load takes it from the server.
 */
export type SeenAtMode = 'server' | 'cleared' | 'kept'

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
    case 'cleared':
      return new Date(getShownUpTo(load))
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
