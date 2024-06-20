import React from 'react'
import {View} from 'react-native'
import {AppBskyActorDefs, moderateProfile, ModerationOpts} from '@atproto/api'

import {sanitizeDisplayName} from 'lib/strings/display-names'
import {sanitizeHandle} from 'lib/strings/handles'
import {ProfileCardPills} from 'view/com/profile/ProfileCard'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'

export function Default({
  profile,
  moderationOpts,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
  moderationOpts: ModerationOpts
}) {
  const t = useTheme()

  const handle = `@${sanitizeHandle(profile.handle)}`
  const name =
    profile.displayName != null && profile.displayName !== ''
      ? sanitizeDisplayName(profile.displayName)
      : handle

  const moderation = moderateProfile(profile, moderationOpts)

  return (
    <Wrapper did={profile.did}>
      <View style={[a.flex_row, a.gap_sm]}>
        <UserAvatar
          size={42}
          avatar={profile.avatar}
          type={
            profile.associated?.labeler
              ? 'labeler'
              : profile.associated?.feedgens
              ? 'algo'
              : 'user'
          }
          moderation={moderation.ui('avatar')}
        />
        <View>
          <Text style={[a.text_md, a.font_bold, a.leading_snug]}>{name}</Text>
          <Text style={[a.leading_snug, t.atoms.text_contrast_medium]}>
            {handle}
          </Text>
        </View>
        <ProfileCardPills
          followedBy={Boolean(profile.viewer?.followedBy)}
          moderation={moderation}
        />
      </View>
      {profile.description && (
        <Text numberOfLines={3}>{profile.description}</Text>
      )}
    </Wrapper>
  )
}

function Wrapper({did, children}: {did: string; children: React.ReactNode}) {
  return (
    <Link
      to={{
        screen: 'Profile',
        params: {name: did},
      }}>
      <View style={[a.flex_1, a.gap_md]}>{children}</View>
    </Link>
  )
}
