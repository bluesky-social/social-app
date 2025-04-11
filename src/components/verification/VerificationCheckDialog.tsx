import {Text as RNText,View} from 'react-native'
import {type AppBskyActorDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {getUserDisplayName} from '#/lib/getUserDisplayName'
import {useSession} from '#/state/session'
import {atoms as a, useBreakpoints,useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useDialogControl} from '#/components/Dialog'
import {VerificationCheck} from '#/components/icons/VerificationCheck'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {type ProfileVerificationState} from '#/components/verification'
import {VerificationRemovePrompt} from '#/components/verification/VerificationRemovePrompt'

export {useDialogControl} from '#/components/Dialog'

export function VerificationCheckDialog({
  control,
  profile,
  verificationState,
}: {
  control: Dialog.DialogControlProps
  profile: AppBskyActorDefs.ProfileViewDetailed
  verificationState: ProfileVerificationState
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
  profile: AppBskyActorDefs.ProfileViewDetailed
  verificationState: ProfileVerificationState
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const {currentAccount} = useSession()
  const verificationRemovePromptControl = useDialogControl()

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
        <Text style={[a.text_2xl, a.font_bold]}>{label}</Text>
        <Text style={[a.text_md, a.leading_snug]}>
          <Trans>
            Verified accounts with this blue check mark{' '}
            <RNText>
              <VerificationCheck width={12} />
            </RNText>{' '}
            next to their name. These accounts have been verified by a trusted
            verifier. These verifiers are picked by Bluesky.
          </Trans>
        </Text>
      </View>

      <View style={[a.pb_xl, a.gap_sm]}>
        <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
          <Trans>Verified by:</Trans>
        </Text>

        <View style={[a.gap_sm]}>
          {Array.from({length: 3}).map((_, i) => (
            <View
              key={i}
              style={[a.rounded_sm, t.atoms.bg_contrast_25, {height: 50}]}
            />
          ))}
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
          to={`https://bsky.social/about`} // TODO
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

      <VerificationRemovePrompt
        control={verificationRemovePromptControl}
        userName={userName}
      />
    </Dialog.ScrollableInner>
  )
}
