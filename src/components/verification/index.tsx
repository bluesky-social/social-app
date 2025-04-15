import {useMemo} from 'react'

import {useSession} from '#/state/session'
import {
  type FullVerificationState,
  type SimpleVerificationState,
} from '#/components/verification/types'
import type * as bsky from '#/types/bsky'
// import {useCurrentAccountProfile} from '#/state/queries/useCurrentAccountProfile'

export type ProfileVerificationState = {
  profile: {
    isSelf: boolean
    isVerified: boolean
    wasVerified: boolean
  }
  viewer: {
    isVerifier: boolean
    hasIssuedVerification: boolean
  }
}

export function useFullVerificationState({
  profile,
}: {
  profile: bsky.profile.AnyProfileView
}): FullVerificationState {
  const {currentAccount} = useSession()
  // const currentAccountProfile = useCurrentAccountProfile()
  return useMemo(() => {
    /*
     * Profile state
     */
    const verifications: any[] = [
      // {issuer: currentAccount?.did}
    ] // profile.verifications
    const {isVerified, isVerifier} = getSimpleVerificationState({profile})
    const wasVerified = !isVerifier && !isVerified && verifications.length > 0

    /*
     * Viewer state
     */
    const isViewerVerifier = true
    // currentAccountProfile
    // ? getSimpleVerificationState({profile: currentAccountProfile}).isVerifier
    // : undefined
    const hasIssuedVerification =
      isViewerVerifier &&
      verifications.find(v => v.issuer === currentAccount?.did)

    return {
      profile: {
        isSelf: profile.did === currentAccount?.did,
        isVerified,
        wasVerified,
        isVerifier,
      },
      viewer: {
        isVerifier: !!isViewerVerifier,
        hasIssuedVerification,
      },
    }
  }, [profile, currentAccount])
}

export function getSimpleVerificationState({}: {
  profile: bsky.profile.AnyProfileView
}): SimpleVerificationState {
  const isVerified = true
  const isVerifier = false

  return {
    isVerified,
    isVerifier,
  }
}

export function useSimpleVerificationState({
  profile,
}: {
  profile: bsky.profile.AnyProfileView
}): SimpleVerificationState {
  return useMemo(() => {
    return getSimpleVerificationState({profile})
  }, [profile])
}
