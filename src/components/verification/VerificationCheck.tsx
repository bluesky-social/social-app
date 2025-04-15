import {type Props} from '#/components/icons/common'
import {VerifiedCheck} from '#/components/icons/VerifiedCheck'
import {VerifierCheck} from '#/components/icons/VerifierCheck'
import {type SimpleVerificationState} from '#/components/verification/types'

export function VerificationCheck({
  isVerified,
  isVerifier,
  ...rest
}: Props & SimpleVerificationState) {
  if (!isVerified) return null

  return isVerifier ? <VerifierCheck {...rest} /> : <VerifiedCheck {...rest} />
}
