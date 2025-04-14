import {useMemo} from 'react'
import {type AppBskyActorDefs} from '@atproto/api'

import {useSession} from '#/state/session'

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
  profile: AppBskyActorDefs.ProfileViewDetailed
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
