import {View} from 'react-native'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {atoms as a, useTheme} from '#/alf'
import * as ProfileCard from '#/components/ProfileCard'
import type * as bsky from '#/types/bsky'

export function ProfileCardWithFollowBtn({
  profile,
  noBorder,
  logContext = 'ProfileCard',
  position,
  contextProfileDid,
}: {
  profile: bsky.profile.AnyProfileView
  noBorder?: boolean
  logContext?: 'ProfileCard' | 'StarterPackProfilesList'
  position?: number
  contextProfileDid?: string
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
        position={position}
        contextProfileDid={contextProfileDid}
      />
    </View>
  )
}
