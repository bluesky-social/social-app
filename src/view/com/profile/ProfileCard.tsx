import {View} from 'react-native'
import {type AppBskyActorDefs} from '@atproto/api'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {atoms as a, useTheme} from '#/alf'
import * as ProfileCard from '#/components/ProfileCard'

export function ProfileCardWithFollowBtn({
  profile,
  noBorder,
  logContext = 'ProfileCard',
}: {
  profile: AppBskyActorDefs.ProfileView
  noBorder?: boolean
  logContext?: 'ProfileCard' | 'StarterPackProfilesList'
}) {
  const t = useTheme()
  const moderationOpts = useModerationOpts()

  if (!moderationOpts) return null

  return (
    <View
      style={[
        a.py_md,
        a.px_xl,
        !noBorder && [a.border_t, t.atoms.border_contrast_low],
      ]}>
      <ProfileCard.Default
        profile={profile}
        moderationOpts={moderationOpts}
        logContext={logContext}
      />
    </View>
  )
}
