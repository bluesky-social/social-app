import {type AnalyticsContextType} from '#/analytics'
import {IS_NATIVE} from '#/env'

/**
 * Whether Following v2 behaviour applies. Every Following v2 call site gates
 * through this rather than reading `following_v2:enable` directly, except the
 * Home tab dot (see {@link isFollowingV2HomeDotEnabled}) and the Home fork
 * (see {@link isFollowingV2HomeForkEnabled}).
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
 * Whether the Home tab shows a dot when the focused Home feed has new posts.
 * This is the one Following v2 behaviour that also runs on web.
 */
export function isFollowingV2HomeDotEnabled(
  ax: Pick<AnalyticsContextType, 'features'>,
) {
  return ax.features.enabled(ax.features.FollowingV2Enable)
}

/**
 * Whether the Home route renders the Following v2 fork of Home in
 * `#/features/followingV2/home` rather than today's Home. This is true wherever
 * `following_v2:enable` is on, web included, so web runs the fork's code and
 * it doesn't rot while Following v2 is built on it.
 *
 * Running the fork's code is not the same as Following v2 behaviour applying.
 * Inside the fork, the behaviours (persistence, prepends, the new posts pill,
 * freshness checks and positioning) stay native-only and keep gating on
 * {@link isFollowingV2Eligible}.
 */
export function isFollowingV2HomeForkEnabled(
  ax: Pick<AnalyticsContextType, 'features'>,
) {
  return ax.features.enabled(ax.features.FollowingV2Enable)
}
