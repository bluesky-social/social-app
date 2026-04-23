import {Pressable, View} from 'react-native'
import {moderateProfile} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {type NavigationProp} from '#/lib/routes/types'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useSession} from '#/state/session'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme, web} from '#/alf'
import {type ConvoWithDetails} from '#/components/dms/util'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'
import {ROW_SPACING} from './constants'
import {MemberMenu} from './MemberMenu'
import {StatusBadge} from './StatusBadge'
import {SubtleHoverWrapper} from './SubtleHoverWrapper'

export function Member({
  convo,
  profile: profileUnshadowed,
  status,
  isOwner,
}: {
  convo: ConvoWithDetails
  profile: bsky.profile.AnyProfileView
  status: 'owner' | 'standard' | 'invited'
  isOwner: boolean
}) {
  const navigation = useNavigation<NavigationProp>()
  const t = useTheme()
  const {t: l} = useLingui()

  const profile = useProfileShadow(profileUnshadowed)
  const {currentAccount} = useSession()
  const moderationOpts = useModerationOpts()
  const moderation = moderationOpts
    ? moderateProfile(profile, moderationOpts)
    : undefined

  // TODO Render a skeleton here. -dsb
  if (!moderation) return null

  const isDeletedAccount = profile.handle === 'missing.invalid'
  const displayName = isDeletedAccount
    ? l`Deleted Account`
    : createSanitizedDisplayName(profile, true, moderation.ui('displayName'))

  const isSelf = currentAccount?.did === profile.did
  let statusBadge: React.ReactNode | null = null
  if (isSelf) {
    if (status === 'owner') {
      statusBadge = <StatusBadge label={l`Admin`} />
    }
  } else {
    statusBadge = (
      <MemberMenu
        convo={convo}
        profile={profile}
        displayName={displayName}
        type={status}
        isOwner={isOwner}
      />
    )
  }

  return (
    <SubtleHoverWrapper>
      <View
        style={[
          a.flex_row,
          a.align_center,
          a.justify_between,
          a.mx_xl,
          {
            marginTop: ROW_SPACING,
            marginBottom: ROW_SPACING,
          },
        ]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={l`View ${displayName}’s profile`}
          accessibilityHint={l`Opens this member’s profile`}
          style={[a.flex_1, a.flex_row, a.align_center]}
          onPress={() => {
            navigation.navigate('Profile', {name: profile.handle})
          }}>
          <PreviewableUserAvatar
            profile={profile}
            size={48}
            moderation={moderation.ui('avatar')}
          />
          <View style={[a.mx_sm]}>
            <Text style={[a.text_md, a.font_semi_bold, t.atoms.text]}>
              {displayName}
            </Text>
            <Text
              style={[
                a.text_xs,
                {color: t.palette.contrast_500},
                web(a.pt_2xs),
              ]}>
              {sanitizeHandle(profile.handle, '@')}
            </Text>
          </View>
        </Pressable>
        <View>{statusBadge}</View>
      </View>
    </SubtleHoverWrapper>
  )
}
