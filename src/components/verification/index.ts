import {useMemo} from 'react'

import {useCurrentAccountProfile} from '#/state/queries/useCurrentAccountProfile'
import {useSession} from '#/state/session'
import type * as bsky from '#/types/bsky'

export type FullVerificationState = {
  profile: {
    role: 'default' | 'verifier'
    isVerified: boolean
    wasVerified: boolean
    isViewer: boolean
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
  return useMemo(() => {
    const verifications = profile.verification?.verifications || []
    const profileState = getSimpleVerificationState({profile})
    const viewerState = getSimpleVerificationState({
      profile: currentAccountProfile,
    })

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
  }, [profile, currentAccount, currentAccountProfile])
}

export type SimpleVerificationState = {
  role: 'default' | 'verifier'
  isVerified: boolean
}

export function getSimpleVerificationState({
  profile,
}: {
  profile?: bsky.profile.AnyProfileView
}): SimpleVerificationState {
  if (!profile || !profile.verification) {
    return {
      role: 'default',
      isVerified: false,
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
  }
}

export function useSimpleVerificationState({
  profile,
}: {
  profile?: bsky.profile.AnyProfileView
}) {
  return useMemo(() => {
    return getSimpleVerificationState({profile})
  }, [profile])
}
