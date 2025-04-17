import {useMemo} from 'react'

import {usePreferencesQuery} from '#/state/queries/preferences'
import {useCurrentAccountProfile} from '#/state/queries/useCurrentAccountProfile'
import {useSession} from '#/state/session'
import type * as bsky from '#/types/bsky'

export type FullVerificationState = {
  profile: {
    role: 'default' | 'verifier'
    isVerified: boolean
    wasVerified: boolean
    isViewer: boolean
    showBadge: boolean
  }
  viewer:
    | {
        role: 'default'
        isVerified: boolean
      }
    | {
        role: 'verifier'
        isVerified: boolean
        hasIssuedVerification: boolean
      }
}

export function useFullVerificationState({
  profile,
}: {
  profile: bsky.profile.AnyProfileView
}): FullVerificationState {
  const {currentAccount} = useSession()
  const currentAccountProfile = useCurrentAccountProfile()
  const profileState = useSimpleVerificationState({profile})
  const viewerState = useSimpleVerificationState({
    profile: currentAccountProfile,
  })

  return useMemo(() => {
    const verifications = profile.verification?.verifications || []
    const wasVerified =
      profileState.role === 'default' &&
      !profileState.isVerified &&
      verifications.length > 0
    const hasIssuedVerification = Boolean(
      viewerState &&
        viewerState.role === 'verifier' &&
        profileState.role === 'default' &&
        verifications.find(v => v.issuer === currentAccount?.did),
    )

    return {
      profile: {
        ...profileState,
        wasVerified,
        isViewer: profile.did === currentAccount?.did,
        showBadge: profileState.showBadge,
      },
      viewer:
        viewerState.role === 'verifier'
          ? {
              role: 'verifier',
              isVerified: viewerState.isVerified,
              hasIssuedVerification,
            }
          : {
              role: 'default',
              isVerified: viewerState.isVerified,
            },
    }
  }, [profile, currentAccount, profileState, viewerState])
}

export type SimpleVerificationState = {
  role: 'default' | 'verifier'
  isVerified: boolean
  showBadge: boolean
}

export function useSimpleVerificationState({
  profile,
}: {
  profile?: bsky.profile.AnyProfileView
}): SimpleVerificationState {
  const preferences = usePreferencesQuery()
  const prefs = useMemo(
    () => preferences.data?.verificationPrefs || {hideBadges: false},
    [preferences.data?.verificationPrefs],
  )
  return useMemo(() => {
    if (!profile || !profile.verification) {
      return {
        role: 'default',
        isVerified: false,
        showBadge: false,
      }
    }

    const {verifiedStatus, trustedVerifierStatus} = profile.verification
    const isVerifiedUser = ['valid', 'invalid'].includes(verifiedStatus)
    const isVerifierUser = ['valid', 'invalid'].includes(trustedVerifierStatus)
    const isVerified =
      (isVerifiedUser && verifiedStatus === 'valid') ||
      (isVerifierUser && trustedVerifierStatus === 'valid')

    return {
      role: isVerifierUser ? 'verifier' : 'default',
      isVerified,
      showBadge: prefs.hideBadges ? false : isVerified,
    }
  }, [profile, prefs])
}
