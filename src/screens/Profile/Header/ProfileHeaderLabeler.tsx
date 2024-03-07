import React, {memo, useMemo} from 'react'
import {View} from 'react-native'
import {
  AppBskyActorDefs,
  AppBskyLabelerDefs,
  ModerationOpts,
  moderateProfile,
  RichText as RichTextAPI,
} from '@atproto/api'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {RichText} from 'view/com/util/text/RichText'
import {useModalControls} from '#/state/modals'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useAnalytics} from 'lib/analytics/analytics'
import {useSession} from '#/state/session'
import {Shadow} from '#/state/cache/types'
import {useProfileShadow} from 'state/cache/profile-shadow'
import {useLabelerSubscriptionMutation} from '#/state/queries/labeler'
import {useLikeMutation, useUnlikeMutation} from '#/state/queries/like'
import {logger} from '#/logger'
import {Haptics} from '#/lib/haptics'
import {pluralize} from '#/lib/strings/helpers'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Toast from '#/view/com/util/Toast'
import {ProfileHeaderShell} from './Shell'
import {ProfileHeaderDropdownBtn} from './DropdownBtn'
import {ProfileHeaderDisplayName} from './DisplayName'
import {ProfileHeaderHandle} from './Handle'
import {ProfileHeaderMetrics} from './Metrics'
import {
  Heart2_Stroke2_Corner0_Rounded as Heart,
  Heart2_Filled_Stroke2_Corner0_Rounded as HeartFilled,
} from '#/components/icons/Heart2'
import {LikesDialog} from '#/components/LikesDialog'
import * as Dialog from '#/components/Dialog'
import {DialogOuterProps} from '#/components/Dialog'
import * as Prompt from '#/components/Prompt'

interface Props {
  profile: AppBskyActorDefs.ProfileViewDetailed
  labeler: AppBskyLabelerDefs.LabelerViewDetailed
  descriptionRT: RichTextAPI | null
  moderationOpts: ModerationOpts
  hideBackButton?: boolean
  isPlaceholderProfile?: boolean
}

let ProfileHeaderLabeler = ({
  profile: profileUnshadowed,
  labeler,
  descriptionRT,
  moderationOpts,
  hideBackButton = false,
  isPlaceholderProfile,
}: Props): React.ReactNode => {
  const profile: Shadow<AppBskyActorDefs.ProfileViewDetailed> =
    useProfileShadow(profileUnshadowed)
  const t = useTheme()
  const {_} = useLingui()
  const {currentAccount, hasSession} = useSession()
  const {openModal} = useModalControls()
  const {track} = useAnalytics()
  const likesControl = Dialog.useDialogControl()
  const cantSubscribePrompt = Prompt.usePromptControl()

  const moderation = useMemo(
    () => moderateProfile(profile, moderationOpts),
    [profile, moderationOpts],
  )
  const {data: preferences} = usePreferencesQuery()
  const {mutateAsync: toggleSubscription, variables} =
    useLabelerSubscriptionMutation()
  const isSubscribed =
    variables?.subscribe ??
    preferences?.moderationPrefs.mods.find(mod => mod.did === profile.did)
  const canSubscribe =
    isSubscribed ||
    (preferences ? preferences?.moderationPrefs.mods.length < 10 : false)
  const {mutateAsync: likeMod, isPending: isLikePending} = useLikeMutation()
  const {mutateAsync: unlikeMod, isPending: isUnlikePending} =
    useUnlikeMutation()
  const [likeUri, setLikeUri] = React.useState<string>(
    labeler.viewer?.like || '',
  )
  const isLiked = !!likeUri

  const onToggleLiked = React.useCallback(async () => {
    if (!labeler) {
      return
    }
    try {
      Haptics.default()

      if (isLiked && likeUri) {
        await unlikeMod({uri: likeUri})
        track('CustomFeed:Unlike')
        setLikeUri('')
      } else {
        const res = await likeMod({uri: labeler.uri, cid: labeler.cid})
        track('CustomFeed:Like')
        setLikeUri(res.uri)
      }
    } catch (e: any) {
      Toast.show(
        _(
          msg`There was an an issue contacting the server, please check your internet connection and try again.`,
        ),
      )
      logger.error(`Failed to toggle labeler like`, {message: e.message})
    }
  }, [labeler, likeUri, isLiked, likeMod, unlikeMod, track, _])

  const onPressEditProfile = React.useCallback(() => {
    track('ProfileHeader:EditProfileButtonClicked')
    openModal({
      name: 'edit-profile',
      profile,
    })
  }, [track, openModal, profile])

  const onPressSubscribe = React.useCallback(async () => {
    if (!canSubscribe) {
      cantSubscribePrompt.open()
      return
    }
    try {
      await toggleSubscription({
        did: profile.did,
        subscribe: !isSubscribed,
      })
    } catch (e: any) {
      // setSubscriptionError(e.message)
      logger.error(`Failed to subscribe to labeler`, {message: e.message})
    }
  }, [
    toggleSubscription,
    isSubscribed,
    profile,
    canSubscribe,
    cantSubscribePrompt,
  ])

  const isMe = React.useMemo(
    () => currentAccount?.did === profile.did,
    [currentAccount, profile],
  )

  return (
    <ProfileHeaderShell
      profile={profile}
      moderation={moderation}
      hideBackButton={hideBackButton}
      isPlaceholderProfile={isPlaceholderProfile}>
      <View style={[a.px_lg, a.pt_md, a.pb_sm]} pointerEvents="box-none">
        <View
          style={[a.flex_row, a.justify_end, a.gap_sm, a.pb_lg]}
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
          ) : (
            <>
              <Button
                testID="toggleSubscribeBtn"
                size="small"
                color={isSubscribed || !canSubscribe ? 'secondary' : 'primary'}
                variant="solid"
                label={
                  isSubscribed
                    ? _(msg`Unsubscribe from this labeler`)
                    : _(msg`Subscribe to this labeler`)
                }
                disabled={!hasSession}
                onPress={onPressSubscribe}
                style={a.rounded_full}>
                <ButtonText
                  style={!canSubscribe && [t.atoms.text_contrast_low]}>
                  {isSubscribed ? (
                    <Trans>Unsubscribe</Trans>
                  ) : (
                    <Trans>Subscribe to labeler</Trans>
                  )}
                </ButtonText>
              </Button>
            </>
          )}
          <ProfileHeaderDropdownBtn profile={profile} />
        </View>
        <View style={[a.flex_col, a.gap_xs, a.pb_md]}>
          <ProfileHeaderDisplayName profile={profile} moderation={moderation} />
          <ProfileHeaderHandle profile={profile} />
        </View>
        {!isPlaceholderProfile && (
          <>
            <ProfileHeaderMetrics profile={profile} />
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
            <View style={[a.flex_row, a.gap_xs, a.align_center, a.pt_md]}>
              <Button
                testID="toggleLikeBtn"
                size="small"
                color="secondary"
                variant="solid"
                shape="round"
                label={_(msg`Like this feed`)}
                disabled={!hasSession || isLikePending || isUnlikePending}
                onPress={onToggleLiked}>
                {isLiked ? (
                  <HeartFilled fill={t.palette.negative_400} />
                ) : (
                  <Heart fill={t.atoms.text_contrast_medium.color} />
                )}
              </Button>

              {typeof labeler.likeCount === 'number' && (
                <Button
                  variant="ghost"
                  size="tiny"
                  onPress={() => likesControl.open()}
                  label={_(
                    msg`Liked by ${labeler.likeCount} ${pluralize(
                      labeler.likeCount,
                      'user',
                    )}`,
                  )}>
                  <ButtonText
                    style={[
                      t.atoms.text_contrast_medium,
                      a.font_bold,
                      a.text_sm,
                    ]}>
                    <Trans>
                      Liked by {labeler.likeCount}{' '}
                      {pluralize(labeler.likeCount, 'user')}
                    </Trans>
                  </ButtonText>
                </Button>
              )}
            </View>
          </>
        )}
      </View>
      <LikesDialog control={likesControl} uri={labeler.uri} />
      <CantSubscribePrompt control={cantSubscribePrompt} />
    </ProfileHeaderShell>
  )
}
ProfileHeaderLabeler = memo(ProfileHeaderLabeler)
export {ProfileHeaderLabeler}

function CantSubscribePrompt({
  control,
}: {
  control: DialogOuterProps['control']
}) {
  return (
    <Prompt.Outer control={control}>
      <Prompt.Title>Unable to subscribe</Prompt.Title>
      <Prompt.Description>
        <Trans>
          We're sorry! You can only subscribe to ten labelers, and you've
          reached your limit of ten.
        </Trans>
      </Prompt.Description>
      <Prompt.Actions>
        <Prompt.Action onPress={control.close}>OK</Prompt.Action>
      </Prompt.Actions>
    </Prompt.Outer>
  )
}
