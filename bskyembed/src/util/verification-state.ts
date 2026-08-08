import {app} from '@bsky.app/sdk/lexicons'

export type VerificationState = {
  role: 'default' | 'verifier'
  isVerified: boolean
}

export function getVerificationState({
  profile,
}: {
  profile?: app.bsky.actor.defs.ProfileViewBasic
}): VerificationState {
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
