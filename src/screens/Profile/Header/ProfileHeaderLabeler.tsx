import React, {memo, useMemo} from 'react'
import {View} from 'react-native'
import {
  AppBskyActorDefs,
  AppBskyLabelerDefs,
  moderateProfile,
  ModerationOpts,
  RichText as RichTextAPI,
} from '@atproto/api'
import {msg, Plural, plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isAppLabeler} from '#/lib/moderation'
import {logger} from '#/logger'
import {Shadow} from '#/state/cache/types'
import {useModalControls} from '#/state/modals'
import {useLabelerSubscriptionMutation} from '#/state/queries/labeler'
import {useLikeMutation, useUnlikeMutation} from '#/state/queries/like'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useRequireAuth, useSession} from '#/state/session'
import {useAnalytics} from 'lib/analytics/analytics'
import {useHaptics} from 'lib/haptics'
import {isIOS} from 'platform/detection'
import {useProfileShadow} from 'state/cache/profile-shadow'
import {ProfileMenu} from '#/view/com/profile/ProfileMenu'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, tokens, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {DialogOuterProps} from '#/components/Dialog'
import {
  Heart2_Filled_Stroke2_Corner0_Rounded as HeartFilled,
  Heart2_Stroke2_Corner0_Rounded as Heart,
} from '#/components/icons/Heart2'
import {Link} from '#/components/Link'
import * as Prompt from '#/components/Prompt'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'
import {ProfileHeaderDisplayName} from './DisplayName'
import {ProfileHeaderHandle} from './Handle'
import {ProfileHeaderMetrics} from './Metrics'
import {ProfileHeaderShell} from './Shell'

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
  const {gtMobile} = useBreakpoints()
  const {_} = useLingui()
  const {currentAccount, hasSession} = useSession()
  const {openModal} = useModalControls()
  const {track} = useAnalytics()
  const requireAuth = useRequireAuth()
  const playHaptic = useHaptics()
  const cantSubscribePrompt = Prompt.usePromptControl()
  const isSelf = currentAccount?.did === profile.did

  const moderation = useMemo(
    () => moderateProfile(profile, moderationOpts),
    [profile, moderationOpts],
  )
  const {data: preferences} = usePreferencesQuery()
  const {mutateAsync: toggleSubscription, variables} =
    useLabelerSubscriptionMutation()
  const isSubscribed =
    variables?.subscribe ??
    preferences?.moderationPrefs.labelers.find(l => l.did === profile.did)
  const canSubscribe =
    isSubscribed ||
    (preferences ? preferences?.moderationPrefs.labelers.length <= 20 : false)
  const {mutateAsync: likeMod, isPending: isLikePending} = useLikeMutation()
  const {mutateAsync: unlikeMod, isPending: isUnlikePending} =
    useUnlikeMutation()
  const [likeUri, setLikeUri] = React.useState<string>(
    labeler.viewer?.like || '',
  )
  const [likeCount, setLikeCount] = React.useState(labeler.likeCount || 0)

  const onToggleLiked = React.useCallback(async () => {
    if (!labeler) {
      return
    }
    try {
      playHaptic()

      if (likeUri) {
        await unlikeMod({uri: likeUri})
        track('CustomFeed:Unlike')
        setLikeCount(c => c - 1)
        setLikeUri('')
      } else {
        const res = await likeMod({uri: labeler.uri, cid: labeler.cid})
        track('CustomFeed:Like')
        setLikeCount(c => c + 1)
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
  }, [labeler, playHaptic, likeUri, unlikeMod, track, likeMod, _])

  const onPressEditProfile = React.useCallback(() => {
    track('ProfileHeader:EditProfileButtonClicked')
    openModal({
      name: 'edit-profile',
      profile,
    })
  }, [track, openModal, profile])

  const onPressSubscribe = React.useCallback(
    () =>
      requireAuth(async (): Promise<void> => {
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
      }),
    [
      requireAuth,
      toggleSubscription,
      isSubscribed,
      profile,
      canSubscribe,
      cantSubscribePrompt,
    ],
  )

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
      <View
        style={[a.px_lg, a.pt_md, a.pb_sm]}
        pointerEvents={isIOS ? 'auto' : 'box-none'}>
        <View
          style={[a.flex_row, a.justify_end, a.gap_sm, a.pb_lg]}
          pointerEvents={isIOS ? 'auto' : 'box-none'}>
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
          ) : !isAppLabeler(profile.did) ? (
            <>
              <Button
                testID="toggleSubscribeBtn"
                label={
                  isSubscribed
                    ? _(msg`Unsubscribe from this labeler`)
                    : _(msg`Subscribe to this labeler`)
                }
                onPress={onPressSubscribe}>
                {state => (
                  <View
                    style={[
                      {
                        paddingVertical: gtMobile ? 12 : 10,
                        backgroundColor:
                          isSubscribed || !canSubscribe
                            ? state.hovered || state.pressed
                              ? t.palette.contrast_50
                              : t.palette.contrast_25
                            : state.hovered || state.pressed
                            ? tokens.color.temp_purple_dark
                            : tokens.color.temp_purple,
                      },
                      a.px_lg,
                      a.rounded_sm,
                      a.gap_sm,
                    ]}>
                    <Text
                      style={[
                        {
                          color: canSubscribe
                            ? isSubscribed
                              ? t.palette.contrast_700
                              : t.palette.white
                            : t.palette.contrast_400,
                        },
                        a.font_bold,
                        a.text_center,
                      ]}>
                      {isSubscribed ? (
                        <Trans>Unsubscribe</Trans>
                      ) : (
                        <Trans>Subscribe to Labeler</Trans>
                      )}
                    </Text>
                  </View>
                )}
              </Button>
            </>
          ) : null}
          <ProfileMenu profile={profile} />
        </View>
        <View style={[a.flex_col, a.gap_xs, a.pb_md]}>
          <ProfileHeaderDisplayName profile={profile} moderation={moderation} />
          <ProfileHeaderHandle profile={profile} />
        </View>
        {!isPlaceholderProfile && (
          <>
            {isSelf && <ProfileHeaderMetrics profile={profile} />}
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
            {!isAppLabeler(profile.did) && (
              <View style={[a.flex_row, a.gap_xs, a.align_center, a.pt_lg]}>
                <Button
                  testID="toggleLikeBtn"
                  size="small"
                  color="secondary"
                  variant="solid"
                  shape="round"
                  label={_(msg`Like this feed`)}
                  disabled={!hasSession || isLikePending || isUnlikePending}
                  onPress={onToggleLiked}>
                  {likeUri ? (
                    <HeartFilled fill={t.palette.negative_400} />
                  ) : (
                    <Heart fill={t.atoms.text_contrast_medium.color} />
                  )}
                </Button>

                {typeof likeCount === 'number' && (
                  <Link
                    to={{
                      screen: 'ProfileLabelerLikedBy',
                      params: {
                        name: labeler.creator.handle || labeler.creator.did,
                      },
                    }}
                    size="tiny"
                    label={plural(likeCount, {
                      one: 'Liked by # user',
                      other: 'Liked by # users',
                    })}>
                    {({hovered, focused, pressed}) => (
                      <Text
                        style={[
                          a.font_bold,
                          a.text_sm,
                          t.atoms.text_contrast_medium,
                          (hovered || focused || pressed) &&
                            t.atoms.text_contrast_high,
                        ]}>
                        <Plural
                          value={likeCount}
                          one="Liked by # user"
                          other="Liked by # users"
                        />
                      </Text>
                    )}
                  </Link>
                )}
              </View>
            )}
          </>
        )}
      </View>
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
  const {_} = useLingui()
  return (
    <Prompt.Outer control={control}>
      <Prompt.TitleText>Unable to subscribe</Prompt.TitleText>
      <Prompt.DescriptionText>
        <Trans>
          We're sorry! You can only subscribe to twenty labelers, and you've
          reached your limit of twenty.
        </Trans>
      </Prompt.DescriptionText>
      <Prompt.Actions>
        <Prompt.Action onPress={() => control.close()} cta={_(msg`OK`)} />
      </Prompt.Actions>
    </Prompt.Outer>
  )
}
