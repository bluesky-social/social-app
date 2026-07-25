import {View} from 'react-native'
import {type AppBskyActorDefs, type ModerationDecision} from '@atproto/api'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {type Shadow} from '#/state/cache/types'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {ProfileBadges} from '#/components/ProfileBadges'
import {Text} from '#/components/Typography'

export function ProfileHeaderDisplayName({
  profile,
  moderation,
}: {
  profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>
  moderation: ModerationDecision
}) {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()

  /*
   * The badges are a sibling of the name rather than a child of it, because an
   * inline view inside a `Text` is measured in SP on Android: the space
   * reserved for it is multiplied by the device font scale a second time (once
   * by `ProfileBadges` itself, then again by the platform), so the badge
   * over-reserves, wraps onto a line of its own and gets painted over the
   * handle below. Baseline alignment keeps the badge sitting on the name's
   * baseline the way an inline view would.
   */
  return (
    <View style={[a.flex_row, a.align_baseline, a.gap_xs]}>
      <Text
        emoji
        testID="profileHeaderDisplayName"
        style={[
          t.atoms.text,
          gtMobile ? a.text_4xl : a.text_3xl,
          a.flex_shrink,
          a.font_bold,
          a.leading_tight,
        ]}>
        {sanitizeDisplayName(
          profile.displayName || sanitizeHandle(profile.handle),
          moderation.ui('displayName'),
        )}
      </Text>
      <ProfileBadges profile={profile} size="lg" interactive />
    </View>
  )
}
