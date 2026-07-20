import {View} from 'react-native'
import {type ModerationDecision} from '@bsky.app/sdk/moderation'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {type Shadow} from '#/state/cache/types'
import {atoms as a, platform, useBreakpoints, useTheme} from '#/alf'
import {ProfileBadges} from '#/components/ProfileBadges'
import {Text} from '#/components/Typography'
import {type app} from '#/lexicons'

export function ProfileHeaderDisplayName({
  profile,
  moderation,
}: {
  profile: Shadow<app.bsky.actor.defs.ProfileViewDetailed>
  moderation: ModerationDecision
}) {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()

  return (
    <View>
      <Text
        emoji
        testID="profileHeaderDisplayName"
        style={[
          t.atoms.text,
          gtMobile ? a.text_4xl : a.text_3xl,
          a.self_start,
          a.font_bold,
          a.leading_tight,
        ]}>
        {sanitizeDisplayName(
          profile.displayName || sanitizeHandle(profile.handle),
          moderation.ui('displayName'),
        )}
        <View style={[a.pl_xs, {marginTop: platform({ios: 2})}]}>
          <ProfileBadges profile={profile} size="lg" interactive />
        </View>
      </Text>
    </View>
  )
}
