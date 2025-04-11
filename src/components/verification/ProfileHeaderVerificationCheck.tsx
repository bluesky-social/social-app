import {View} from 'react-native'
import {type AppBskyActorDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {type Shadow} from '#/state/cache/types'
import {atoms as a, platform, useBreakpoints, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {VerificationCheck as VerificationCheckIcon} from '#/components/icons/VerificationCheck'
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
  const size = gtPhone ? 20 : 16

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
        style={[]}>
        {({hovered}) => (
          <View
            style={[
              a.justify_end,
              a.align_end,
              a.transition_transform,
              {
                top: platform({android: 2}),
                width: size,
                height: size,
                transform: [
                  {
                    scale: hovered ? 1.1 : 1,
                  },
                ],
              },
            ]}>
            <VerificationCheckIcon
              width={size}
              fill={
                state.profile.isVerified
                  ? t.palette.primary_500
                  : t.atoms.bg_contrast_100.backgroundColor
              }
            />
          </View>
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
