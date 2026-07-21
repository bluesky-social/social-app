import {type Insets, View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {type Shadow} from '#/state/cache/types'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {useFullVerificationState} from '#/components/verification'
import {type FullVerificationState} from '#/components/verification'
import {VerificationCheck} from '#/components/verification/VerificationCheck'
import {VerificationsDialog} from '#/components/verification/VerificationsDialog'
import {VerifierDialog} from '#/components/verification/VerifierDialog'
import {useAnalytics} from '#/analytics'
import type * as bsky from '#/types/bsky'

export function shouldShowVerificationCheckButton(
  state: FullVerificationState,
) {
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
    if (state.profile.isViewer) {
      ok = true
    } else if (state.profile.isVerified) {
      ok = true
    }
  }

  if (
    !state.profile.showBadge &&
    !state.profile.isViewer &&
    !(state.viewer.role === 'verifier' && state.viewer.hasIssuedVerification)
  ) {
    ok = false
  }

  return ok
}

export function VerificationCheckButton({
  profile,
  width,
  hitSlop,
}: {
  profile: Shadow<bsky.profile.AnyProfileView>
  width: number
  hitSlop: Insets
}) {
  const state = useFullVerificationState({
    profile,
  })

  if (shouldShowVerificationCheckButton(state)) {
    return (
      <Badge
        profile={profile}
        verificationState={state}
        width={width}
        hitSlop={hitSlop}
      />
    )
  }

  return null
}

function Badge({
  profile,
  verificationState: state,
  width,
  hitSlop,
}: {
  profile: Shadow<bsky.profile.AnyProfileView>
  verificationState: FullVerificationState
  width: number
  hitSlop: Insets
}) {
  const t = useTheme()
  const ax = useAnalytics()
  const {t: l} = useLingui()
  const verificationsDialogControl = useDialogControl()
  const verifierDialogControl = useDialogControl()

  const verifiedByHidden = !state.profile.showBadge && state.profile.isViewer

  return (
    <>
      <Button
        label={
          state.profile.isViewer
            ? l`View your verifications`
            : l`View this user's verifications`
        }
        hitSlop={hitSlop}
        onPress={evt => {
          evt.preventDefault()
          ax.metric('verification:badge:click', {})
          if (state.profile.role === 'verifier') {
            verifierDialogControl.open()
          } else {
            verificationsDialogControl.open()
          }
        }}>
        {({hovered}) => (
          <View
            style={[
              a.justify_end,
              a.align_end,
              a.transition_transform,
              {
                width: width,
                height: width,
                transform: [
                  {
                    scale: hovered ? 1.1 : 1,
                  },
                ],
              },
            ]}>
            <VerificationCheck
              width={width}
              fill={
                verifiedByHidden
                  ? t.atoms.bg_contrast_100.backgroundColor
                  : state.profile.isVerified
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
