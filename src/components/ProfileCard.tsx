import React from 'react'
import {View} from 'react-native'
import {AppBskyActorDefs, moderateProfile, ModerationOpts} from '@atproto/api'

import {createSanitizedDisplayName} from 'lib/moderation/create-sanitized-display-name'
import {sanitizeHandle} from 'lib/strings/handles'
import {useProfileShadow} from 'state/cache/profile-shadow'
import {useSession} from 'state/session'
import {FollowButton} from 'view/com/profile/FollowButton'
import {ProfileCardPills} from 'view/com/profile/ProfileCard'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'

export function Default({
  profile: profileUnshadowed,
  moderationOpts,
  logContext = 'ProfileCard',
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
  moderationOpts: ModerationOpts
  logContext?: 'ProfileCard' | 'StarterPackProfilesList'
}) {
  const t = useTheme()
  const {currentAccount, hasSession} = useSession()

  const profile = useProfileShadow(profileUnshadowed)
  const name = createSanitizedDisplayName(profile)
  const handle = `@${sanitizeHandle(profile.handle)}`
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
        <View style={[a.flex_1]}>
          <Text
            style={[a.text_md, a.font_bold, a.leading_snug]}
            numberOfLines={1}>
            {name}
          </Text>
          <Text
            style={[a.leading_snug, t.atoms.text_contrast_medium]}
            numberOfLines={1}>
            {handle}
          </Text>
        </View>
        {hasSession && profile.did !== currentAccount?.did && (
          <View style={[a.justify_center, {marginLeft: 'auto'}]}>
            <FollowButton profile={profile} logContext={logContext} />
          </View>
        )}
      </View>
      <View style={[a.mb_xs]}>
        <ProfileCardPills
          followedBy={Boolean(profile.viewer?.followedBy)}
          moderation={moderation}
        />
      </View>
      {profile.description && (
        <Text numberOfLines={3} style={[a.leading_snug]}>
          {profile.description}
        </Text>
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
      <View style={[a.flex_1, a.gap_xs]}>{children}</View>
    </Link>
  )
}
