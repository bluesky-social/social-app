import React, {memo, useMemo} from 'react'
import {View} from 'react-native'
import {
  AppBskyActorDefs,
  ModerationOpts,
  moderateProfile,
  RichText as RichTextAPI,
} from '@atproto/api'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'

import {useModalControls} from '#/state/modals'
import {useAnalytics} from 'lib/analytics/analytics'
import {useSession, useRequireAuth} from '#/state/session'
import {Shadow} from '#/state/cache/types'
import {useProfileShadow} from 'state/cache/profile-shadow'
import {
  useProfileFollowMutationQueue,
  useProfileBlockMutationQueue,
} from '#/state/queries/profile'
import {logger} from '#/logger'
import {pluralize} from '#/lib/strings/helpers'
import {makeProfileLink} from 'lib/routes/links'
import {formatCount} from 'view/com/util/numeric/format'
import {sanitizeDisplayName} from 'lib/strings/display-names'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {InlineLink} from '#/components/Link'
import {Button, ButtonText} from '#/components/Button'
import * as Toast from '#/view/com/util/Toast'
import {ProfileHeaderShell} from './Shell'
import {ProfileHeaderDropdownBtn} from './DropdownBtn'
import {ProfileHeaderDisplayName} from './DisplayName'
import {ProfileHeaderHandle} from './Handle'
import {ProfileHeaderSuggestedFollows} from '#/view/com/profile/ProfileHeaderSuggestedFollows'
import {RichText} from 'view/com/util/text/RichText'

interface Props {
  profile: AppBskyActorDefs.ProfileViewDetailed
  descriptionRT: RichTextAPI | null
  moderationOpts: ModerationOpts
  hideBackButton?: boolean
  isPlaceholderProfile?: boolean
}

let ProfileHeaderStandard = ({
  profile: profileUnshadowed,
  descriptionRT,
  moderationOpts,
  hideBackButton = false,
  isPlaceholderProfile,
}: Props): React.ReactNode => {
  const profile: Shadow<AppBskyActorDefs.ProfileViewDetailed> =
    useProfileShadow(profileUnshadowed)
  const t = useTheme()
  const {currentAccount, hasSession} = useSession()
  const {_} = useLingui()
  const {openModal} = useModalControls()
  const {track} = useAnalytics()
  const moderation = useMemo(
    () => moderateProfile(profile, moderationOpts),
    [profile, moderationOpts],
  )
  const [showSuggestedFollows, setShowSuggestedFollows] = React.useState(false)
  const [queueFollow, queueUnfollow] = useProfileFollowMutationQueue(profile)
  const [_queueBlock, queueUnblock] = useProfileBlockMutationQueue(profile)
  const requireAuth = useRequireAuth()

  const onPressEditProfile = React.useCallback(() => {
    track('ProfileHeader:EditProfileButtonClicked')
    openModal({
      name: 'edit-profile',
      profile,
    })
  }, [track, openModal, profile])

  const onPressFollow = () => {
    requireAuth(async () => {
      try {
        track('ProfileHeader:FollowButtonClicked')
        await queueFollow()
        Toast.show(
          _(
            msg`Following ${sanitizeDisplayName(
              profile.displayName || profile.handle,
            )}`,
          ),
        )
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          logger.error('Failed to follow', {message: String(e)})
          Toast.show(_(msg`There was an issue! ${e.toString()}`))
        }
      }
    })
  }

  const onPressUnfollow = () => {
    requireAuth(async () => {
      try {
        track('ProfileHeader:UnfollowButtonClicked')
        await queueUnfollow()
        Toast.show(
          _(
            msg`No longer following ${sanitizeDisplayName(
              profile.displayName || profile.handle,
            )}`,
          ),
        )
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          logger.error('Failed to unfollow', {message: String(e)})
          Toast.show(_(msg`There was an issue! ${e.toString()}`))
        }
      }
    })
  }

  const onPressUnblockAccount = React.useCallback(async () => {
    track('ProfileHeader:UnblockAccountButtonClicked')
    openModal({
      name: 'confirm',
      title: _(msg`Unblock Account`),
      message: _(
        msg`The account will be able to interact with you after unblocking.`,
      ),
      onPressConfirm: async () => {
        try {
          await queueUnblock()
          Toast.show(_(msg`Account unblocked`))
        } catch (e: any) {
          if (e?.name !== 'AbortError') {
            logger.error('Failed to unblock account', {message: e})
            Toast.show(_(msg`There was an issue! ${e.toString()}`))
          }
        }
      },
    })
  }, [track, queueUnblock, openModal, _])

  const isMe = React.useMemo(
    () => currentAccount?.did === profile.did,
    [currentAccount, profile],
  )
  const following = formatCount(profile.followsCount || 0)
  const followers = formatCount(profile.followersCount || 0)
  const pluralizedFollowers = pluralize(profile.followersCount || 0, 'follower')

  return (
    <ProfileHeaderShell
      profile={profile}
      moderation={moderation}
      hideBackButton={hideBackButton}
      isPlaceholderProfile={isPlaceholderProfile}>
      <View style={[a.px_lg, a.pt_md, a.pb_sm]} pointerEvents="box-none">
        <View
          style={[a.flex_row, a.justify_end, a.gap_sm, a.pb_sm]}
          pointerEvents="box-none">
          {isMe ? (
            <Button
              testID="profileHeaderEditProfileButton"
              size="small"
              color="secondary"
              variant="solid"
              onPress={onPressEditProfile}
              label={_(msg`Edit profile`)}
              style={a.rounded_full}>
              <ButtonText>
                <Trans>Edit Profile</Trans>
              </ButtonText>
            </Button>
          ) : profile.viewer?.blocking ? (
            profile.viewer?.blockingByList ? null : (
              <Button
                testID="unblockBtn"
                size="small"
                color="secondary"
                variant="solid"
                label={_(msg`Unblock`)}
                disabled={!hasSession}
                onPress={onPressUnblockAccount}
                style={a.rounded_full}>
                <ButtonText>
                  <Trans context="action">Unblock</Trans>
                </ButtonText>
              </Button>
            )
          ) : !profile.viewer?.blockedBy ? (
            <>
              {hasSession && (
                <Button
                  testID="suggestedFollowsBtn"
                  size="small"
                  color={showSuggestedFollows ? 'primary' : 'secondary'}
                  variant="solid"
                  shape="round"
                  onPress={() => setShowSuggestedFollows(!showSuggestedFollows)}
                  label={_(msg`Show follows similar to ${profile.handle}`)}>
                  <FontAwesomeIcon
                    icon="user-plus"
                    style={
                      showSuggestedFollows
                        ? {color: t.palette.white}
                        : t.atoms.text
                    }
                    size={14}
                  />
                </Button>
              )}

              <Button
                testID={profile.viewer?.following ? 'unfollowBtn' : 'followBtn'}
                size="small"
                color={profile.viewer?.following ? 'secondary' : 'primary'}
                variant="solid"
                label={
                  profile.viewer?.following
                    ? _(msg`Unfollow ${profile.handle}`)
                    : _(msg`Follow ${profile.handle}`)
                }
                disabled={!hasSession}
                onPress={
                  profile.viewer?.following ? onPressUnfollow : onPressFollow
                }
                style={a.rounded_full}>
                <ButtonText>
                  {profile.viewer?.following ? (
                    <Trans>Following</Trans>
                  ) : (
                    <Trans>Follow</Trans>
                  )}
                </ButtonText>
              </Button>
            </>
          ) : null}
          <ProfileHeaderDropdownBtn profile={profile} />
        </View>
        <View style={[a.flex_col, a.gap_xs, a.pb_sm]}>
          <ProfileHeaderDisplayName profile={profile} moderation={moderation} />
          <ProfileHeaderHandle profile={profile} />
        </View>
        {!isPlaceholderProfile && (
          <>
            <View
              style={[a.flex_row, a.gap_sm, a.align_center, a.pb_md]}
              pointerEvents="box-none">
              <InlineLink
                testID="profileHeaderFollowersButton"
                style={a.flex_row}
                to={makeProfileLink(profile, 'followers')}
                label={`${followers} ${pluralizedFollowers}`}>
                <Text style={[a.font_bold, t.atoms.text, a.text_md]}>
                  {followers}{' '}
                </Text>
                <Text style={[t.atoms.text_contrast_medium, a.text_md]}>
                  {pluralizedFollowers}
                </Text>
              </InlineLink>
              <InlineLink
                testID="profileHeaderFollowsButton"
                style={a.flex_row}
                to={makeProfileLink(profile, 'follows')}
                label={_(msg`${following} following`)}>
                <Trans>
                  <Text style={[a.font_bold, t.atoms.text, a.text_md]}>
                    {following}{' '}
                  </Text>
                  <Text style={[t.atoms.text_contrast_medium, a.text_md]}>
                    following
                  </Text>
                </Trans>
              </InlineLink>
              <Text style={[a.font_bold, t.atoms.text, a.text_md]}>
                {formatCount(profile.postsCount || 0)}{' '}
                <Text
                  style={[
                    t.atoms.text_contrast_medium,
                    a.font_normal,
                    a.text_md,
                  ]}>
                  {pluralize(profile.postsCount || 0, 'post')}
                </Text>
              </Text>
            </View>
            {descriptionRT && !moderation.ui('profileView').blur ? (
              <View pointerEvents="auto">
                <RichText
                  testID="profileHeaderDescription"
                  style={t.atoms.text}
                  numberOfLines={15}
                  richText={descriptionRT}
                />
              </View>
            ) : undefined}
          </>
        )}
      </View>
      {showSuggestedFollows && (
        <ProfileHeaderSuggestedFollows
          actorDid={profile.did}
          requestDismiss={() => {
            if (showSuggestedFollows) {
              setShowSuggestedFollows(false)
            } else {
              track('ProfileHeader:SuggestedFollowsOpened')
              setShowSuggestedFollows(true)
            }
          }}
        />
      )}
    </ProfileHeaderShell>
  )
}
ProfileHeaderStandard = memo(ProfileHeaderStandard)
export {ProfileHeaderStandard}
