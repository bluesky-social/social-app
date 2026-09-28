import {hashKey, type QueryKey} from '@tanstack/react-query'

import {
  FOLLOWING_SNAPSHOT_QUERY_HASH,
  FOLLOWING_SNAPSHOT_RESTORE_ENABLED,
} from '#/state/queries/post-feed-snapshot'
import {type AnalyticsContextType} from '#/analytics'
import {IS_NATIVE} from '#/env'

/**
 * Whether Following v2 behaviour applies. Every Following v2 call site gates
 * through this rather than reading `following_v2:enable` directly, except the
 * Home tab dot (see {@link isFollowingV2HomeDotEnabled}).
 *
 * Following v2 is native-only: web keeps its existing fetch, refresh and
 * navigation behaviour whatever the flag says. The platform check runs first,
 * so web never evaluates the flag or logs an exposure for it.
 *
 * Takes `ax` rather than calling `useAnalytics()` so it works in render and in
 * non-hook code that already holds it, and so call sites can evaluate it
 * lazily.
 *
 * Later this will also check exact feed classification, the backend capability
 * Following needs, and verified native runtime support.
 */
export function isFollowingV2Eligible(
  ax: Pick<AnalyticsContextType, 'features'>,
) {
  return IS_NATIVE && ax.features.enabled(ax.features.FollowingV2Enable)
}

/**
 * Whether a post feed is the one Following v2 restores from disk and follows
 * up: Home's Following feed, unmerged, with Following v2 and snapshot restore
 * switched on. Only its list anchors what is added above its posts, and only
 * it shows the "Show more posts" rows at gaps. Other feeds, For You and
 * Discover among them, never do.
 *
 * Takes the feed's query key (`RQKEY`) rather than its descriptor, since the
 * exact query is what is persisted.
 */
export function isFollowingRestorationEnabled(
  ax: Pick<AnalyticsContextType, 'features'>,
  queryKey: QueryKey,
) {
  return (
    FOLLOWING_SNAPSHOT_RESTORE_ENABLED &&
    hashKey(queryKey) === FOLLOWING_SNAPSHOT_QUERY_HASH &&
    isFollowingV2Eligible(ax)
  )
}

/**
 * Whether the Home tab shows a dot when the focused Home feed has new posts.
 * This is the one Following v2 behaviour that also runs on web.
 */
export function isFollowingV2HomeDotEnabled(
  ax: Pick<AnalyticsContextType, 'features'>,
) {
  return ax.features.enabled(ax.features.FollowingV2Enable)
}
