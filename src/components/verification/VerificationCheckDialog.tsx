import {View} from 'react-native'
import {type AppBskyActorDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useSession} from '#/state/session'
import {atoms as a} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'
import {type ProfileVerificationState} from '#/components/verification'

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
}: {
  control: Dialog.DialogControlProps
  profile: AppBskyActorDefs.ProfileViewDetailed
  verificationState: ProfileVerificationState
}) {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const isSelf = profile.did === currentAccount?.did
  const name = sanitizeDisplayName(
    profile.displayName || sanitizeHandle(profile.handle, '@'),
  )
  const label = isSelf
    ? _(msg`Your verifications`)
    : _(
        msg({
          message: `${name}'s verifications`,
          comment: `Possessive, meaning "the verifications of {name}"`,
        }),
      )
  return (
    <Dialog.ScrollableInner label={label}>
      <View>
        <Text style={[a.text_2xl, a.font_bold]}>{label}</Text>
      </View>
    </Dialog.ScrollableInner>
  )
}
