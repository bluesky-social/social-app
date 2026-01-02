import * as bsky from '../types/bsky'

export type VerificationState = {
  role: 'default' | 'verifier'
  isVerified: boolean
}

export function getVerificationState({
  profile,
}: {
  profile?: bsky.profile.AnyProfileView
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
