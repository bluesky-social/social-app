import {View} from 'react-native'
import {Plural} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {AvatarStack} from '#/components/AvatarStack'
import {shouldShowKnownFollowers} from '#/components/KnownFollowers'
import {Text} from '#/components/Typography'
import {type app} from '#/lexicons'

/** Avatar plus its 1px border, matching a 16px avatar. */
const AVATAR_STACK_SIZE = 18

/**
 * Compact “N followers you know” row for app cards. Renders nothing when none
 * of the viewer's follows follow the app's profile.
 */
export function AppKnownFollowers({
  profile,
}: {
  profile: app.bsky.actor.defs.ProfileViewDetailed
}) {
  const t = useTheme()
  const knownFollowers = profile.viewer?.knownFollowers

  if (!knownFollowers || !shouldShowKnownFollowers(knownFollowers)) return null

  return (
    <View
      style={[
        a.flex_row,
        a.flex_shrink,
        a.align_center,
        // Aligns the first avatar's visible edge, not its border, with content above
        {marginLeft: -1, gap: 5},
      ]}>
      <AvatarStack
        profiles={knownFollowers.followers.slice(0, 3)}
        size={AVATAR_STACK_SIZE}
      />
      <Text
        style={[
          a.flex_shrink,
          a.text_xs,
          a.leading_snug,
          t.atoms.text_contrast_medium,
        ]}
        numberOfLines={1}>
        <Plural
          value={knownFollowers.count}
          one="# follower you know"
          other="# followers you know"
        />
      </Text>
    </View>
  )
}
