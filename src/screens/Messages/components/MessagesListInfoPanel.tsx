import {View} from 'react-native'
import {moderateProfile} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {type NavigationProp} from '#/lib/routes/types'
import {isInvalidHandle, sanitizeHandle} from '#/lib/strings/handles'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useSession} from '#/state/session'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {type ConvoWithDetails} from '#/components/dms/util'
import {Person_Stroke2_Corner2_Rounded as PersonIcon} from '#/components/icons/Person'
import {ProfileBadges} from '#/components/ProfileBadges'
import * as ProfileCard from '#/components/ProfileCard'
import {Text} from '#/components/Typography'

export function MessagesListInfoPanel({
  convo,
}: {
  convo: Extract<ConvoWithDetails, {kind: 'direct'}>
}) {
  const navigation = useNavigation<NavigationProp>()
  const t = useTheme()
  const {t: l} = useLingui()

  const {currentAccount} = useSession()
  const moderationOpts = useModerationOpts()

  const profile = convo.members.filter(
    profile => profile.did !== currentAccount?.did,
  )[0]
  const handle = sanitizeHandle(profile.handle, '@')
  const displayName = moderationOpts
    ? createSanitizedDisplayName(
        profile,
        true,
        moderateProfile(profile, moderationOpts).ui('displayName'),
      )
    : handle
  const profileLink =
    profile.handle && !isInvalidHandle(profile.handle)
      ? profile.handle
      : profile.did

  return (
    <View style={[a.align_center, a.justify_center]}>
      <UserAvatar type="user" size={88} avatar={profile?.avatar} />
      <View
        style={[
          a.flex_row,
          a.align_center,
          a.justify_center,
          a.gap_xs,
          a.mt_lg,
          a.px_xl,
          a.max_w_full,
        ]}>
        <Text
          style={[a.text_2xl, a.font_bold, a.text_center, a.flex_shrink]}
          numberOfLines={1}
          emoji>
          {displayName}
        </Text>
        <ProfileBadges profile={profile} size="lg" />
      </View>
      <Text style={[a.text_sm, a.mt_xs, t.atoms.text_contrast_high]}>
        {handle}
      </Text>
      {moderationOpts ? (
        <View style={[a.mt_xs]}>
          <ProfileCard.Labels
            profile={profile}
            moderationOpts={moderationOpts}
          />
        </View>
      ) : null}
      <View
        style={[
          a.flex_row,
          a.align_center,
          a.justify_center,
          a.gap_sm,
          a.mt_lg,
          a.mb_4xl,
        ]}>
        <Button
          color="secondary"
          size="small"
          label={l`Go to user’s profile`}
          onPress={() => {
            navigation.navigate('Profile', {name: profileLink})
          }}>
          <ButtonIcon icon={PersonIcon} />
          <ButtonText>
            <Trans>Go to profile</Trans>
          </ButtonText>
        </Button>
      </View>
    </View>
  )
}
