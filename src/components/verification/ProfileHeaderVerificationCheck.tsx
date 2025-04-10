import {View} from 'react-native'
import {type AppBskyActorDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {type Shadow} from '#/state/cache/types'
import {atoms as a, useBreakpoints,useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {
  type ProfileVerificationState,
  useVerificationStateForProfile,
} from '#/components/verification'
import {VerificationCheckDialog} from '#/components/verification/VerificationCheckDialog'

export function VerificationCheck({
  profile,
}: {
  profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>
}) {
  const state = useVerificationStateForProfile({
    profile,
  })

  if (
    state.profile.isVerified ||
    (state.profile.isSelf && state.profile.wasVerified) ||
    (state.viewer.isVerifier && state.viewer.hasIssuedVerification)
  ) {
    return <Badge profile={profile} verificationState={state} />
  }

  return null
}

export function Badge({
  profile,
  verificationState: state,
}: {
  // TODO optimistic
  profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>
  verificationState: ProfileVerificationState
}) {
  const t = useTheme()
  const {_} = useLingui()
  const verificationsDialogControl = useDialogControl()
  const {gtPhone} = useBreakpoints()

  return (
    <>
      <Button
        label={
          state.profile.isSelf
            ? _(msg`View your verifications`)
            : _(msg`View this user's verifications`)
        }
        hitSlop={20}
        onPress={() => verificationsDialogControl.open()}
        style={[gtPhone ? {width: 32, height: 32} : {width: 26, height: 26}]}>
        {({hovered}) => (
          <View
            style={[
              a.w_full,
              a.rounded_full,
              a.transition_transform,
              {
                backgroundColor: state.profile.wasVerified
                  ? t.atoms.bg_contrast_100.backgroundColor
                  : t.palette.primary_500,
                paddingTop: '100%',
                transform: [
                  {
                    scale: hovered ? 1.1 : 1,
                  },
                ],
              },
            ]}
          />
        )}
      </Button>
      <VerificationCheckDialog
        control={verificationsDialogControl}
        profile={profile}
        verificationState={state}
      />
    </>
  )
}
