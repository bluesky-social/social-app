import {type AnalyticsContextType} from '#/analytics'
import {IS_NATIVE} from '#/env'

/**
 * Whether Following v2 behaviour applies. Every Following v2 call site gates
 * through this rather than reading `following_v2:enable` directly.
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
