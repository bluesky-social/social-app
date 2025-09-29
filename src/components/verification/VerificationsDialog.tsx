import {View} from 'react-native'
import {type AppBskyActorDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {urls} from '#/lib/constants'
import {getUserDisplayName} from '#/lib/getUserDisplayName'
import {logger} from '#/logger'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useDialogControl} from '#/components/Dialog'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'
import {Link} from '#/components/Link'
import * as ProfileCard from '#/components/ProfileCard'
import {Text} from '#/components/Typography'
import {type FullVerificationState} from '#/components/verification'
import {VerificationRemovePrompt} from '#/components/verification/VerificationRemovePrompt'
import type * as bsky from '#/types/bsky'

export {useDialogControl} from '#/components/Dialog'

export function VerificationsDialog({
  control,
  profile,
  verificationState,
}: {
  control: Dialog.DialogControlProps
  profile: bsky.profile.AnyProfileView
  verificationState: FullVerificationState
}) {
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Inner
        control={control}
        profile={profile}
        verificationState={verificationState}
      />
    </Dialog.Outer>
  )
}

function Inner({
  profile,
  control,
  verificationState: state,
}: {
  control: Dialog.DialogControlProps
  profile: bsky.profile.AnyProfileView
  verificationState: FullVerificationState
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()

  const userName = getUserDisplayName(profile)
  const label = state.profile.isViewer
    ? state.profile.isVerified
      ? _(msg`You are verified`)
      : _(msg`Your verifications`)
    : state.profile.isVerified
      ? _(msg`${userName} is verified`)
      : _(
          msg({
            message: `${userName}'s verifications`,
            comment: `Possessive, meaning "the verifications of {userName}"`,
          }),
        )

  return (
    <Dialog.ScrollableInner
      label={label}
      style={[
        gtMobile ? {width: 'auto', maxWidth: 400, minWidth: 200} : a.w_full,
      ]}>
      <View style={[a.gap_sm, a.pb_lg]}>
        <Text style={[a.text_2xl, a.font_semi_bold, a.pr_4xl, a.leading_tight]}>
          {label}
        </Text>
        <Text style={[a.text_md, a.leading_snug]}>
          {state.profile.isVerified ? (
            <Trans>
              This account has a checkmark because it's been verified by trusted
              sources.
            </Trans>
          ) : (
            <Trans>
              This account has one or more attempted verifications, but it is
              not currently verified.
            </Trans>
          )}
        </Text>
      </View>

      {profile.verification ? (
        <View style={[a.pb_xl, a.gap_md]}>
          <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
            <Trans>Verified by:</Trans>
          </Text>

          <View style={[a.gap_lg]}>
            {profile.verification.verifications.map(v => (
              <VerifierCard
                key={v.uri}
                verification={v}
                subject={profile}
                outerDialogControl={control}
              />
            ))}
          </View>

          {profile.verification.verifications.some(v => !v.isValid) &&
            state.profile.isViewer && (
              <Admonition type="warning" style={[a.mt_xs]}>
                <Trans>Some of your verifications are invalid.</Trans>
              </Admonition>
            )}
        </View>
      ) : null}

      <View
        style={[
          a.w_full,
          a.gap_sm,
          a.justify_end,
          gtMobile
            ? [a.flex_row, a.flex_row_reverse, a.justify_start]
            : [a.flex_col],
        ]}>
        <Button
          label={_(msg`Close dialog`)}
          size="small"
          variant="solid"
          color="primary"
          onPress={() => {
            control.close()
          }}>
          <ButtonText>
            <Trans>Close</Trans>
          </ButtonText>
        </Button>
        <Link
          overridePresentation
          to={urls.website.blog.initialVerificationAnnouncement}
          label={_(
            msg({
              message: `Learn more about verification on Bluesky`,
              context: `english-only-resource`,
            }),
          )}
          size="small"
          variant="solid"
          color="secondary"
          style={[a.justify_center]}
          onPress={() => {
            logger.metric(
              'verification:learn-more',
              {
                location: 'verificationsDialog',
              },
              {statsig: true},
            )
          }}>
          <ButtonText>
            <Trans context="english-only-resource">Learn more</Trans>
          </ButtonText>
        </Link>
      </View>

      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

function VerifierCard({
  verification,
  subject,
  outerDialogControl,
}: {
  verification: AppBskyActorDefs.VerificationView
  subject: bsky.profile.AnyProfileView
  outerDialogControl: Dialog.DialogControlProps
}) {
  const t = useTheme()
  const {_, i18n} = useLingui()
  const {currentAccount} = useSession()
  const moderationOpts = useModerationOpts()
  const {data: profile, error} = useProfileQuery({did: verification.issuer})
  const verificationRemovePromptControl = useDialogControl()
  const canAdminister = verification.issuer === currentAccount?.did

  return (
    <View
      style={{
        opacity: verification.isValid ? 1 : 0.5,
      }}>
      <ProfileCard.Outer>
        <ProfileCard.Header>
          {error ? (
            <>
              <ProfileCard.AvatarPlaceholder />
              <View style={[a.flex_1]}>
                <Text
                  style={[a.text_md, a.font_semi_bold, a.leading_snug]}
                  numberOfLines={1}>
                  <Trans>Unknown verifier</Trans>
                </Text>
                <Text
                  emoji
                  style={[a.leading_snug, t.atoms.text_contrast_medium]}
                  numberOfLines={1}>
                  {verification.issuer}
                </Text>
              </View>
            </>
          ) : profile && moderationOpts ? (
            <>
              <ProfileCard.Link
                profile={profile}
                style={[a.flex_row, a.align_center, a.gap_sm, a.flex_1]}
                onPress={() => {
                  outerDialogControl.close()
                }}>
                <ProfileCard.Avatar
                  profile={profile}
                  moderationOpts={moderationOpts}
                  disabledPreview
                />
                <View style={[a.flex_1]}>
                  <ProfileCard.Name
                    profile={profile}
                    moderationOpts={moderationOpts}
                  />
                  <Text
                    emoji
                    style={[a.leading_snug, t.atoms.text_contrast_medium]}
                    numberOfLines={1}>
                    {i18n.date(new Date(verification.createdAt), {
                      dateStyle: 'long',
                    })}
                  </Text>
                </View>
              </ProfileCard.Link>
              {canAdminister && (
                <View>
                  <Button
                    label={_(msg`Remove verification`)}
                    size="small"
                    variant="outline"
                    color="negative"
                    shape="round"
                    onPress={() => {
                      verificationRemovePromptControl.open()
                    }}>
                    <ButtonIcon icon={TrashIcon} />
                  </Button>
                </View>
              )}
            </>
          ) : (
            <>
              <ProfileCard.AvatarPlaceholder />
              <ProfileCard.NameAndHandlePlaceholder />
            </>
          )}
        </ProfileCard.Header>
      </ProfileCard.Outer>

      <VerificationRemovePrompt
        control={verificationRemovePromptControl}
        profile={subject}
        verifications={[verification]}
        onConfirm={() => outerDialogControl.close()}
      />
    </View>
  )
}
