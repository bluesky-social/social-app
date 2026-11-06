import {View} from 'react-native'
import {Plural, useLingui} from '@lingui/react/macro'

import {makeProfileLink} from '#/lib/routes/links'
import {atoms as a, useTheme} from '#/alf'
import {AvatarStack} from '#/components/AvatarStack'
import {shouldShowKnownFollowers} from '#/components/KnownFollowers'
import {Link} from '#/components/Link'
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
  link = false,
}: {
  profile: app.bsky.actor.defs.ProfileViewDetailed
  /**
   * Link to the profile's known followers screen. Leave off when the row sits
   * inside another pressable.
   */
  link?: boolean
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const knownFollowers = profile.viewer?.knownFollowers

  if (!knownFollowers || !shouldShowKnownFollowers(knownFollowers)) return null

  const content = ({hovered = false}: {hovered?: boolean}) => (
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
          hovered && {textDecorationLine: 'underline'},
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

  if (!link) return content({})

  return (
    <Link
      label={l`View followers of this account that you also follow`}
      to={makeProfileLink(profile, 'known-followers')}
      style={[a.self_start, a.max_w_full]}>
      {({hovered}) => content({hovered})}
    </Link>
  )
}
