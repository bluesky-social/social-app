import {
  type HomeTabNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {HomeScreen as LegacyHomeScreen} from '#/view/screens/Home'
import {useAnalytics} from '#/analytics'
import {isFollowingV2Eligible} from '#/features/followingV2/eligibility'
import {HomeScreen as FollowingV2HomeScreen} from './Home'

/**
 * The Home route. With Following v2 eligible it renders the fork of Home in
 * this directory, which is where Following v2 changes land. Otherwise it
 * renders today's Home, unchanged. Web resolves `index.web.tsx`, which is
 * today's Home directly.
 */
export function HomeScreen(
  props: NativeStackScreenProps<HomeTabNavigatorParams, 'Home' | 'Start'>,
) {
  const ax = useAnalytics()
  return isFollowingV2Eligible(ax) ? (
    <FollowingV2HomeScreen {...props} />
  ) : (
    <LegacyHomeScreen {...props} />
  )
}
