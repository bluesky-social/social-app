import {View} from 'react-native'

import {isBotAccount} from '#/lib/bots'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {atoms as a, type ViewStyleProp} from '#/alf'
import {BotBadge, BotBadgeButton} from '#/components/BotBadge'
import {useSimpleVerificationState} from '#/components/verification'
import {VerificationCheck} from '#/components/verification/VerificationCheck'
import {VerificationCheckButton} from '#/components/verification/VerificationCheckButton'
import type * as bsky from '#/types/bsky'

export function ProfileBadges({
  profile,
  interactive = false,
  size,
  style,
}: ViewStyleProp & {
  profile: bsky.profile.AnyProfileView
  interactive?: boolean
  size: 'lg' | 'md' | 'sm'
}) {
  const shadowed = useProfileShadow(profile)
  const verification = useSimpleVerificationState({profile})

  // if nothing to show, don't render the container at all
  if (!verification.showBadge && !isBotAccount(shadowed)) return null

  return (
    <View style={[a.flex_row, a.align_center, a.gap_xs, style]}>
      {interactive ? (
        <>
          <VerificationCheckButton profile={shadowed} size={size} />
          <BotBadgeButton profile={shadowed} size={size} />
        </>
      ) : (
        <>
          {verification.showBadge && (
            <VerificationCheck
              verifier={verification.role === 'verifier'}
              size={size}
            />
          )}
          <BotBadge profile={shadowed} size={size} />
        </>
      )}
    </View>
  )
}
