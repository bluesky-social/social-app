import {memo, useMemo, useState} from 'react'
import {View} from 'react-native'
import {
  type AppBskyActorDefs,
  moderateProfile,
  type ModerationDecision,
  type ModerationOpts,
  type RichText as RichTextAPI,
} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useActorStatus} from '#/lib/actor-status'
import {useHaptics} from '#/lib/haptics'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {logger} from '#/logger'
import {isIOS} from '#/platform/detection'
import {type Shadow, useProfileShadow} from '#/state/cache/profile-shadow'
import {
  useProfileBlockMutationQueue,
  useProfileFollowMutationQueue,
} from '#/state/queries/profile'
import {useRequireAuth, useSession} from '#/state/session'
import {ProfileMenu} from '#/view/com/profile/ProfileMenu'
import {atoms as a, platform, useBreakpoints, useTheme} from '#/alf'
import {SubscribeProfileButton} from '#/components/activity-notifications/SubscribeProfileButton'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {DebugFieldDisplay} from '#/components/DebugFieldDisplay'
import {useDialogControl} from '#/components/Dialog'
import {MessageProfileButton} from '#/components/dms/MessageProfileButton'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {
  KnownFollowers,
  shouldShowKnownFollowers,
} from '#/components/KnownFollowers'
import * as Prompt from '#/components/Prompt'
import {RichText} from '#/components/RichText'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {VerificationCheckButton} from '#/components/verification/VerificationCheckButton'
import {EditProfileDialog} from './EditProfileDialog'
import {ProfileHeaderHandle} from './Handle'
import {ProfileHeaderMetrics} from './Metrics'
import {ProfileHeaderShell} from './Shell'
import {AnimatedProfileHeaderSuggestedFollows} from './SuggestedFollows'

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
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const profile =
    useProfileShadow<AppBskyActorDefs.ProfileViewDetailed>(profileUnshadowed)
  const {currentAccount} = useSession()
  const {_} = useLingui()
  const moderation = useMemo(
    () => moderateProfile(profile, moderationOpts),
    [profile, moderationOpts],
  )
  const [, queueUnblock] = useProfileBlockMutationQueue(profile)
  const unblockPromptControl = Prompt.usePromptControl()
  const [showSuggestedFollows, setShowSuggestedFollows] = useState(false)
  const isBlockedUser =
    profile.viewer?.blocking ||
    profile.viewer?.blockedBy ||
    profile.viewer?.blockingByList

  const unblockAccount = async () => {
    try {
      await queueUnblock()
      Toast.show(_(msg({message: 'Account unblocked', context: 'toast'})))
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        logger.error('Failed to unblock account', {message: e})
        Toast.show(_(msg`There was an issue! ${e.toString()}`), {type: 'error'})
      }
    }
  }

  const isMe = currentAccount?.did === profile.did

  const {isActive: live} = useActorStatus(profile)

  return (
    <>
      <ProfileHeaderShell
        profile={profile}
        moderation={moderation}
        hideBackButton={hideBackButton}
        isPlaceholderProfile={isPlaceholderProfile}>
        <View
          style={[a.px_lg, a.pt_md, a.pb_sm, a.overflow_hidden]}
          pointerEvents={isIOS ? 'auto' : 'box-none'}>
          <View
            style={[
              {paddingLeft: 90},
              a.flex_row,
              a.align_center,
              a.justify_end,
              a.gap_xs,
              a.pb_sm,
              a.flex_wrap,
            ]}
            pointerEvents={isIOS ? 'auto' : 'box-none'}>
            <HeaderStandardButtons
              profile={profile}
              moderation={moderation}
              moderationOpts={moderationOpts}
              onFollow={() => setShowSuggestedFollows(true)}
              onUnfollow={() => setShowSuggestedFollows(false)}
            />
          </View>
          <View
            style={[a.flex_col, a.gap_xs, a.pb_sm, live ? a.pt_sm : a.pt_2xs]}>
            <View style={[a.flex_row, a.align_center, a.gap_xs, a.flex_1]}>
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
                  <VerificationCheckButton profile={profile} size="lg" />
                </View>
              </Text>
            </View>
            <ProfileHeaderHandle profile={profile} />
          </View>
          {!isPlaceholderProfile && !isBlockedUser && (
            <View style={a.gap_md}>
              <ProfileHeaderMetrics profile={profile} />
              {descriptionRT && !moderation.ui('profileView').blur ? (
                <View pointerEvents="auto">
                  <RichText
                    testID="profileHeaderDescription"
                    style={[a.text_md]}
                    numberOfLines={15}
                    value={descriptionRT}
                    enableTags
                    authorHandle={profile.handle}
                  />
                </View>
              ) : undefined}

              {!isMe &&
                !isBlockedUser &&
                shouldShowKnownFollowers(profile.viewer?.knownFollowers) && (
                  <View style={[a.flex_row, a.align_center, a.gap_sm]}>
                    <KnownFollowers
                      profile={profile}
                      moderationOpts={moderationOpts}
                    />
                  </View>
                )}
            </View>
          )}

          <DebugFieldDisplay subject={profile} />
        </View>

        <Prompt.Basic
          control={unblockPromptControl}
          title={_(msg`Unblock Account?`)}
          description={_(
            msg`The account will be able to interact with you after unblocking.`,
          )}
          onConfirm={unblockAccount}
          confirmButtonCta={
            profile.viewer?.blocking ? _(msg`Unblock`) : _(msg`Block`)
          }
          confirmButtonColor="negative"
        />
      </ProfileHeaderShell>

      <AnimatedProfileHeaderSuggestedFollows
        isExpanded={showSuggestedFollows}
        actorDid={profile.did}
      />
    </>
  )
}

ProfileHeaderStandard = memo(ProfileHeaderStandard)
export {ProfileHeaderStandard}

export function HeaderStandardButtons({
  profile,
  moderation,
  moderationOpts,
  onFollow,
  onUnfollow,
  minimal,
}: {
  profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>
  moderation: ModerationDecision
  moderationOpts: ModerationOpts
  onFollow?: () => void
  onUnfollow?: () => void
  minimal?: boolean
}) {
  const {_} = useLingui()
  const {hasSession, currentAccount} = useSession()
  const playHaptic = useHaptics()
  const requireAuth = useRequireAuth()
  const [queueFollow, queueUnfollow] = useProfileFollowMutationQueue(
    profile,
    'ProfileHeader',
  )
  const [, queueUnblock] = useProfileBlockMutationQueue(profile)
  const editProfileControl = useDialogControl()
  const unblockPromptControl = Prompt.usePromptControl()

  const isMe = currentAccount?.did === profile.did

  const onPressFollow = () => {
    playHaptic()
    requireAuth(async () => {
      try {
        await queueFollow()
        onFollow?.()
        Toast.show(
          _(
            msg`Following ${sanitizeDisplayName(
              profile.displayName || profile.handle,
              moderation.ui('displayName'),
            )}`,
          ),
        )
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          logger.error('Failed to follow', {message: String(e)})
          Toast.show(_(msg`There was an issue! ${e.toString()}`), {
            type: 'error',
          })
        }
      }
    })
  }

  const onPressUnfollow = () => {
    playHaptic()
    requireAuth(async () => {
      try {
        await queueUnfollow()
        onUnfollow?.()
        Toast.show(
          _(
            msg`No longer following ${sanitizeDisplayName(
              profile.displayName || profile.handle,
              moderation.ui('displayName'),
            )}`,
          ),
          {type: 'default'},
        )
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          logger.error('Failed to unfollow', {message: String(e)})
          Toast.show(_(msg`There was an issue! ${e.toString()}`), {
            type: 'error',
          })
        }
      }
    })
  }

  const unblockAccount = async () => {
    try {
      await queueUnblock()
      Toast.show(_(msg({message: 'Account unblocked', context: 'toast'})))
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        logger.error('Failed to unblock account', {message: e})
        Toast.show(_(msg`There was an issue! ${e.toString()}`), {type: 'error'})
      }
    }
  }

  const subscriptionsAllowed = useMemo(() => {
    switch (profile.associated?.activitySubscription?.allowSubscriptions) {
      case 'followers':
      case undefined:
        return !!profile.viewer?.following
      case 'mutuals':
        return !!profile.viewer?.following && !!profile.viewer.followedBy
      case 'none':
      default:
        return false
    }
  }, [profile])

  return (
    <>
      {isMe ? (
        <>
          <Button
            testID="profileHeaderEditProfileButton"
            size="small"
            color="secondary"
            onPress={editProfileControl.open}
            label={_(msg`Edit profile`)}>
            <ButtonText>
              <Trans>Edit Profile</Trans>
            </ButtonText>
          </Button>
          <EditProfileDialog profile={profile} control={editProfileControl} />
        </>
      ) : profile.viewer?.blocking ? (
        profile.viewer?.blockingByList ? null : (
          <Button
            testID="unblockBtn"
            size="small"
            color="secondary"
            label={_(msg`Unblock`)}
            disabled={!hasSession}
            onPress={() => unblockPromptControl.open()}>
            <ButtonText>
              <Trans context="action">Unblock</Trans>
            </ButtonText>
          </Button>
        )
      ) : !profile.viewer?.blockedBy ? (
        <>
          {hasSession && (!minimal || profile.viewer?.following) && (
            <>
              {subscriptionsAllowed && (
                <SubscribeProfileButton
                  profile={profile}
                  moderationOpts={moderationOpts}
                  disableHint={minimal}
                />
              )}

              <MessageProfileButton profile={profile} />
            </>
          )}

          {(!minimal || !profile.viewer?.following) && (
            <Button
              testID={profile.viewer?.following ? 'unfollowBtn' : 'followBtn'}
              size="small"
              color={profile.viewer?.following ? 'secondary' : 'primary'}
              label={
                profile.viewer?.following
                  ? _(msg`Unfollow ${profile.handle}`)
                  : _(msg`Follow ${profile.handle}`)
              }
              onPress={
                profile.viewer?.following ? onPressUnfollow : onPressFollow
              }>
              {!profile.viewer?.following && <ButtonIcon icon={Plus} />}
              <ButtonText>
                {profile.viewer?.following ? (
                  <Trans>Following</Trans>
                ) : profile.viewer?.followedBy ? (
                  <Trans>Follow back</Trans>
                ) : (
                  <Trans>Follow</Trans>
                )}
              </ButtonText>
            </Button>
          )}
        </>
      ) : null}
      <ProfileMenu profile={profile} />

      <Prompt.Basic
        control={unblockPromptControl}
        title={_(msg`Unblock Account?`)}
        description={_(
          msg`The account will be able to interact with you after unblocking.`,
        )}
        onConfirm={unblockAccount}
        confirmButtonCta={_(msg`Unblock`)}
        confirmButtonColor="negative"
      />
    </>
  )
}
