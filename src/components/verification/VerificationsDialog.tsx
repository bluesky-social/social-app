import {useState} from 'react'
import {Text as RNText, View} from 'react-native'
import {type AppBskyActorDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {urls} from '#/lib/constants'
import {getUserDisplayName} from '#/lib/getUserDisplayName'
import {NON_BREAKING_SPACE} from '#/lib/strings/constants'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useDialogControl} from '#/components/Dialog'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'
import {VerifiedCheck} from '#/components/icons/VerifiedCheck'
import {Link} from '#/components/Link'
import {Loader} from '#/components/Loader'
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
      <Inner
        control={control}
        profile={profile}
        verificationState={verificationState}
      />
      <Dialog.Close />
    </Dialog.Outer>
  )
}

function Inner({
  profile,
  control,
}: {
  control: Dialog.DialogControlProps
  profile: bsky.profile.AnyProfileView
  verificationState: FullVerificationState
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const {currentAccount} = useSession()

  const isSelf = profile.did === currentAccount?.did
  const userName = getUserDisplayName(profile)
  const label = isSelf
    ? _(msg`Your verifications`)
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
      <Dialog.Handle />

      <View style={[a.gap_sm, a.pb_lg]}>
        <Text style={[a.text_2xl, a.font_bold, a.pr_4xl, a.leading_tight]}>
          {label}
        </Text>
        <Text style={[a.text_md, a.leading_snug]}>
          <Trans>
            Verified accounts with this blue check mark
            <RNText>
              {NON_BREAKING_SPACE}
              <VerifiedCheck width={14} />
              {NON_BREAKING_SPACE}
            </RNText>
            next to their name. These accounts have been verified by a trusted
            verifier. These verifiers are picked by Bluesky.
          </Trans>
        </Text>
      </View>

      <View style={[a.pb_xl, a.gap_md]}>
        <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
          <Trans>Verified by:</Trans>
        </Text>

        <View style={[a.gap_lg]}>
          {profile.verification
            ? profile.verification?.verifications.map(v => (
                <VerifierCard key={v.uri} verification={v} subject={profile} />
              ))
            : null}
        </View>
      </View>

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
          to={urls.website.blog.initialVerificationAnnouncement}
          label={_(msg`Learn more about verification on Bluesky`)}
          size="small"
          variant="solid"
          color="secondary"
          style={[a.justify_center]}>
          <ButtonText>
            <Trans>Learn more</Trans>
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
}: {
  verification: AppBskyActorDefs.VerificationView
  subject: bsky.profile.AnyProfileView
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const moderationOpts = useModerationOpts()
  const {data: profile, error} = useProfileQuery({did: verification.issuer})
  const verificationRemovePromptControl = useDialogControl()
  const canAdminister = verification.issuer === currentAccount?.did
  const [pending, setPending] = useState(false)

  return (
    <View>
      <ProfileCard.Outer>
        <ProfileCard.Header>
          {error ? (
            <>
              <ProfileCard.AvatarPlaceholder />
              <View style={[a.flex_1]}>
                <Text
                  style={[a.text_md, a.font_bold, a.leading_snug]}
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
              <ProfileCard.Avatar
                profile={profile}
                moderationOpts={moderationOpts}
              />
              <ProfileCard.NameAndHandle
                profile={profile}
                moderationOpts={moderationOpts}
              />
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
                    <ButtonIcon icon={pending ? Loader : TrashIcon} />
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
        onConfirm={() => setPending(true)}
      />
    </View>
  )
}
