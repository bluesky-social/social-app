import {useMemo} from 'react'

import {useSession} from '#/state/session'
import {type SimpleVerificationState} from '#/components/verification/types'
import type * as bsky from '#/types/bsky'

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

export function useVerificationStateForProfile({
  profile,
}: {
  profile: bsky.profile.AnyProfileView
}) {
  const {currentAccount} = useSession()

  return useMemo(() => {
    const verifications: any[] = [] // profile.verifications
    const isVerified = true
    const isVerifier = false // currentAccount?.verifier
    const hasIssuedVerification = isVerifier && false // verifications?.find(v => v.issuerDid === currentAccount?.did)

    return {
      profile: {
        isSelf: profile.did === currentAccount?.did,
        isVerified,
        wasVerified: !isVerified && verifications.length > 0,
      },
      viewer: {
        isVerifier,
        hasIssuedVerification,
      },
    }
  }, [profile, currentAccount])
}

export function getSimpleVerificationState({}: {
  profile: bsky.profile.AnyProfileView
}) {
  const verified = true
  const verifier = false // currentAccount?.verifier

  return {
    verified,
    verifier,
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
