import {Plural} from '@lingui/react/macro'

import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {useProfileQuery} from '#/state/queries/profile'
import {useResolveDidQuery} from '#/state/queries/resolve-uri'
import {ProfileFollowers as ProfileFollowersComponent} from '#/view/com/profile/ProfileFollowers'
import * as Layout from '#/components/Layout'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileFollowers'>
export const ProfileFollowersScreen = ({route}: Props) => {
  const {name} = route.params

  const {data: resolvedDid} = useResolveDidQuery(name)
  const {data: profile} = useProfileQuery({
    did: resolvedDid,
  })

  return (
    <Layout.Screen testID="profileFollowersScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          {profile && (
            <>
              <Layout.Header.TitleText>
                {sanitizeDisplayName(profile.displayName || profile.handle)}
              </Layout.Header.TitleText>
              <Layout.Header.SubtitleText>
                <Plural
                  value={profile.followersCount ?? 0}
                  one="# follower"
                  other="# followers"
                />
              </Layout.Header.SubtitleText>
            </>
          )}
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <ProfileFollowersComponent name={name} />
    </Layout.Screen>
  )
}
