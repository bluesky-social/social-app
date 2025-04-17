import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {type Shadow} from '#/state/cache/types'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {useFullVerificationState} from '#/components/verification'
import {type FullVerificationState} from '#/components/verification'
import {VerificationCheck} from '#/components/verification/VerificationCheck'
import {VerificationsDialog} from '#/components/verification/VerificationsDialog'
import {VerifierDialog} from '#/components/verification/VerifierDialog'
import type * as bsky from '#/types/bsky'

export function VerificationCheckButton({
  profile,
  size,
}: {
  profile: Shadow<bsky.profile.AnyProfileView>
  size: 'lg' | 'md' | 'sm'
}) {
  const state = useFullVerificationState({
    profile,
  })

  let ok = false

  if (state.profile.role === 'default') {
    if (state.profile.isVerified) {
      ok = true
    } else if (state.profile.isViewer && state.profile.wasVerified) {
      ok = true
    } else if (
      state.viewer.role === 'verifier' &&
      state.viewer.hasIssuedVerification
    ) {
      ok = true
    }
  } else if (state.profile.role === 'verifier') {
    ok = true
  }

  if (ok) {
    return <Badge profile={profile} verificationState={state} size={size} />
  }

  return null
}

export function Badge({
  profile,
  verificationState: state,
  size,
}: {
  profile: Shadow<bsky.profile.AnyProfileView>
  verificationState: FullVerificationState
  size: 'lg' | 'md' | 'sm'
}) {
  const t = useTheme()
  const {_} = useLingui()
  const verificationsDialogControl = useDialogControl()
  const verifierDialogControl = useDialogControl()
  const {gtPhone} = useBreakpoints()
  let dimensions = 12
  if (size === 'lg') {
    dimensions = gtPhone ? 20 : 18
  } else if (size === 'md') {
    dimensions = 14
  }

  return (
    <>
      <Button
        label={
          state.profile.isViewer
            ? _(msg`View your verifications`)
            : _(msg`View this user's verifications`)
        }
        hitSlop={20}
        onPress={() => {
          if (state.profile.role === 'verifier') {
            verifierDialogControl.open()
          } else {
            verificationsDialogControl.open()
          }
        }}
        style={[]}>
        {({hovered}) => (
          <View
            style={[
              a.justify_end,
              a.align_end,
              a.transition_transform,
              {
                width: dimensions,
                height: dimensions,
                transform: [
                  {
                    scale: hovered ? 1.1 : 1,
                  },
                ],
              },
            ]}>
            <VerificationCheck
              width={dimensions}
              fill={
                state.profile.isVerified
                  ? t.palette.primary_500
                  : t.atoms.bg_contrast_100.backgroundColor
              }
              verifier={state.profile.role === 'verifier'}
            />
          </View>
        )}
      </Button>
      <VerificationsDialog
        control={verificationsDialogControl}
        profile={profile}
        verificationState={state}
      />

      <VerifierDialog
        control={verifierDialogControl}
        profile={profile}
        verificationState={state}
      />
    </>
  )
}
