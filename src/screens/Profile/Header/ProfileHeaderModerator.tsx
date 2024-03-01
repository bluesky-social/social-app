import React, {memo, useMemo} from 'react'
import {View} from 'react-native'
import {
  AppBskyActorDefs,
  AppBskyModerationDefs,
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
import {useModServiceSubscriptionMutation} from '#/state/queries/modservice'
import {useLikeMutation, useUnlikeMutation} from '#/state/queries/like'
import {logger} from '#/logger'
import {Haptics} from '#/lib/haptics'
import {pluralize} from '#/lib/strings/helpers'

import {atoms as a, useTheme} from '#/alf'
import {InlineLink} from '#/components/Link'
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

interface Props {
  profile: AppBskyActorDefs.ProfileViewDetailed
  modservice: AppBskyModerationDefs.ModServiceViewDetailed
  descriptionRT: RichTextAPI | null
  moderationOpts: ModerationOpts
  hideBackButton?: boolean
  isPlaceholderProfile?: boolean
}

let ProfileHeaderModerator = ({
  profile: profileUnshadowed,
  modservice,
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
  const {data: preferences} = usePreferencesQuery()
  const {mutateAsync: toggleSubscription, variables} =
    useModServiceSubscriptionMutation()
  const isSubscribed =
    variables?.subscribe ??
    preferences?.moderationPrefs.mods.find(mod => mod.did === profile.did)
  const {mutateAsync: likeMod, isPending: isLikePending} = useLikeMutation()
  const {mutateAsync: unlikeMod, isPending: isUnlikePending} =
    useUnlikeMutation()
  const [likeUri, setLikeUri] = React.useState<string>(
    modservice.viewer?.like || '',
  )
  const isLiked = !!likeUri

  const onToggleLiked = React.useCallback(async () => {
    if (!modservice) {
      return
    }
    try {
      Haptics.default()

      if (isLiked && likeUri) {
        await unlikeMod({uri: likeUri})
        track('CustomFeed:Unlike')
        setLikeUri('')
      } else {
        const res = await likeMod({uri: modservice.uri, cid: modservice.cid})
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
  }, [modservice, likeUri, isLiked, likeMod, unlikeMod, track, _])

  const onPressEditProfile = React.useCallback(() => {
    track('ProfileHeader:EditProfileButtonClicked')
    openModal({
      name: 'edit-profile',
      profile,
    })
  }, [track, openModal, profile])

  const onPressSubscribe = React.useCallback(async () => {
    try {
      await toggleSubscription({
        did: profile.did,
        subscribe: !isSubscribed,
      })
    } catch (e: any) {
      // setSubscriptionError(e.message)
      logger.error(`Failed to subscribe to labeler`, {message: e.message})
    }
  }, [toggleSubscription, isSubscribed, profile])

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
          ) : (
            <>
              <Button
                testID="toggleSubscribeBtn"
                size="small"
                color={isSubscribed ? 'secondary' : 'primary'}
                variant="solid"
                label={
                  isSubscribed
                    ? _(msg`Unsubscribe from this labeler`)
                    : _(msg`Subscribe to this labeler`)
                }
                disabled={!hasSession}
                onPress={onPressSubscribe}
                style={a.rounded_full}>
                <ButtonText>
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
            <View style={[a.flex_row, a.gap_md, a.align_center, a.pt_md]}>
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

              {typeof modservice.likeCount === 'number' && (
                <InlineLink
                  to={'#todo'}
                  style={[t.atoms.text_contrast_medium, a.font_bold]}>
                  <Trans>
                    Liked by {modservice.likeCount}{' '}
                    {pluralize(modservice.likeCount, 'user')}
                  </Trans>
                </InlineLink>
              )}
            </View>
          </>
        )}
      </View>
    </ProfileHeaderShell>
  )
}
ProfileHeaderModerator = memo(ProfileHeaderModerator)
export {ProfileHeaderModerator}
