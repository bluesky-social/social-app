import {memo, useCallback, useMemo, useState} from 'react'
import {View} from 'react-native'
import {
  type AppBskyActorDefs,
  type AppBskyLabelerDefs,
  moderateProfile,
  type ModerationOpts,
  type RichText as RichTextAPI,
} from '@atproto/api'
import {msg, Plural, plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {MAX_LABELERS} from '#/lib/constants'
import {useHaptics} from '#/lib/haptics'
import {isAppLabeler} from '#/lib/moderation'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {type Shadow} from '#/state/cache/types'
import {useLabelerSubscriptionMutation} from '#/state/queries/labeler'
import {useLikeMutation, useUnlikeMutation} from '#/state/queries/like'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useRequireAuth, useSession} from '#/state/session'
import {ProfileMenu} from '#/view/com/profile/ProfileMenu'
import {atoms as a, tokens, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {type DialogOuterProps, useDialogControl} from '#/components/Dialog'
import {
  Heart2_Filled_Stroke2_Corner0_Rounded as HeartFilled,
  Heart2_Stroke2_Corner0_Rounded as Heart,
} from '#/components/icons/Heart2'
import {Link} from '#/components/Link'
import * as Prompt from '#/components/Prompt'
import {RichText} from '#/components/RichText'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_IOS} from '#/env'
import {ProfileHeaderDisplayName} from './DisplayName'
import {EditProfileDialog} from './EditProfileDialog'
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
  const ax = useAnalytics()
  const {_} = useLingui()
  const {currentAccount, hasSession} = useSession()
  const playHaptic = useHaptics()
  const isSelf = currentAccount?.did === profile.did

  const moderation = useMemo(
    () => moderateProfile(profile, moderationOpts),
    [profile, moderationOpts],
  )
  const {mutateAsync: likeMod, isPending: isLikePending} = useLikeMutation()
  const {mutateAsync: unlikeMod, isPending: isUnlikePending} =
    useUnlikeMutation()
  const [likeUri, setLikeUri] = useState(labeler.viewer?.like || '')
  const [likeCount, setLikeCount] = useState(labeler.likeCount || 0)

  const onToggleLiked = useCallback(async () => {
    if (!labeler) {
      return
    }
    try {
      playHaptic()

      if (likeUri) {
        await unlikeMod({uri: likeUri})
        setLikeCount(c => c - 1)
        setLikeUri('')
      } else {
        const res = await likeMod({uri: labeler.uri, cid: labeler.cid})
        setLikeCount(c => c + 1)
        setLikeUri(res.uri)
      }
    } catch (e: any) {
      Toast.show(
        _(
          msg`There was an issue contacting the server, please check your internet connection and try again.`,
        ),
        {type: 'error'},
      )
      ax.logger.error(`Failed to toggle labeler like`, {message: e.message})
    }
  }, [ax, labeler, playHaptic, likeUri, unlikeMod, likeMod, _])

  return (
    <ProfileHeaderShell
      profile={profile}
      moderation={moderation}
      hideBackButton={hideBackButton}
      isPlaceholderProfile={isPlaceholderProfile}>
      <View
        style={[a.px_lg, a.pt_md, a.pb_sm]}
        pointerEvents={IS_IOS ? 'auto' : 'box-none'}>
        <View
          style={[a.flex_row, a.justify_end, a.align_center, a.gap_xs, a.pb_lg]}
          pointerEvents={IS_IOS ? 'auto' : 'box-none'}>
          <HeaderLabelerButtons profile={profile} />
        </View>
        <View style={[a.flex_col, a.gap_2xs, a.pt_2xs, a.pb_md]}>
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
                  shape="round"
                  label={_(msg`Like this labeler`)}
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
                    label={_(
                      msg`Liked by ${plural(likeCount, {
                        one: '# user',
                        other: '# users',
                      })}`,
                    )}>
                    {({hovered, focused, pressed}) => (
                      <Text
                        style={[
                          a.font_semi_bold,
                          a.text_sm,
                          t.atoms.text_contrast_medium,
                          (hovered || focused || pressed) &&
                            t.atoms.text_contrast_high,
                        ]}>
                        <Trans>
                          Liked by{' '}
                          <Plural
                            value={likeCount}
                            one="# user"
                            other="# users"
                          />
                        </Trans>
                      </Text>
                    )}
                  </Link>
                )}
              </View>
            )}
          </>
        )}
      </View>
    </ProfileHeaderShell>
  )
}
ProfileHeaderLabeler = memo(ProfileHeaderLabeler)
export {ProfileHeaderLabeler}

/**
 * Keep this in sync with the value of {@link MAX_LABELERS}
 */
function CantSubscribePrompt({
  control,
}: {
  control: DialogOuterProps['control']
}) {
  const {_} = useLingui()
  return (
    <Prompt.Outer control={control}>
      <Prompt.Content>
        <Prompt.TitleText>Unable to subscribe</Prompt.TitleText>
        <Prompt.DescriptionText>
          <Trans>
            We're sorry! You can only subscribe to twenty labelers, and you've
            reached your limit of twenty.
          </Trans>
        </Prompt.DescriptionText>
      </Prompt.Content>
      <Prompt.Actions>
        <Prompt.Action onPress={() => control.close()} cta={_(msg`OK`)} />
      </Prompt.Actions>
    </Prompt.Outer>
  )
}

export function HeaderLabelerButtons({
  profile,
  minimal = false,
}: {
  profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>
  /** disable the subscribe button */
  minimal?: boolean
}) {
  const t = useTheme()
  const ax = useAnalytics()
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const requireAuth = useRequireAuth()
  const playHaptic = useHaptics()
  const editProfileControl = useDialogControl()
  const {data: preferences} = usePreferencesQuery()
  const {
    mutateAsync: toggleSubscription,
    variables,
    reset,
  } = useLabelerSubscriptionMutation()
  const isSubscribed =
    variables?.subscribe ??
    preferences?.moderationPrefs.labelers.find(l => l.did === profile.did)

  const cantSubscribePrompt = Prompt.usePromptControl()

  const isMe = currentAccount?.did === profile.did

  const onPressSubscribe = () =>
    requireAuth(async (): Promise<void> => {
      playHaptic()
      const subscribe = !isSubscribed

      try {
        await toggleSubscription({
          did: profile.did,
          subscribe,
        })

        ax.metric(
          subscribe
            ? 'moderation:subscribedToLabeler'
            : 'moderation:unsubscribedFromLabeler',
          {},
        )
      } catch (e: any) {
        reset()
        if (e.message === 'MAX_LABELERS') {
          cantSubscribePrompt.open()
          return
        }
        ax.logger.error(`Failed to subscribe to labeler`, {message: e.message})
      }
    })
  return (
    <>
      {isMe ? (
        <>
          <Button
            testID="profileHeaderEditProfileButton"
            size="small"
            color="secondary"
            onPress={editProfileControl.open}
            label={_(msg`Edit profile`)}
            style={a.rounded_full}>
            <ButtonText>
              <Trans>Edit Profile</Trans>
            </ButtonText>
          </Button>
          <EditProfileDialog profile={profile} control={editProfileControl} />
        </>
      ) : !isAppLabeler(profile.did) && !minimal ? (
        // hidden in the minimal header, because it's not shadowed so the two buttons
        // can get out of sync. if you want to reenable, you'll need to add shadowing
        // to the subscribed state -sfn
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
                  paddingVertical: 9,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                  gap: 6,
                  backgroundColor: isSubscribed
                    ? state.hovered || state.pressed
                      ? t.palette.contrast_50
                      : t.palette.contrast_25
                    : state.hovered || state.pressed
                      ? tokens.color.temp_purple_dark
                      : tokens.color.temp_purple,
                },
              ]}>
              <Text
                style={[
                  {
                    color: isSubscribed
                      ? t.palette.contrast_700
                      : t.palette.white,
                  },
                  a.font_semi_bold,
                  a.text_center,
                  a.leading_tight,
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
      ) : null}
      <ProfileMenu profile={profile} />

      <CantSubscribePrompt control={cantSubscribePrompt} />
    </>
  )
}
