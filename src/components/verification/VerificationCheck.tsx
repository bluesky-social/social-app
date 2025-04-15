import {type Props} from '#/components/icons/common'
import {VerifiedCheck} from '#/components/icons/VerifiedCheck'
import {VerifierCheck} from '#/components/icons/VerifierCheck'
import {type SimpleVerificationState} from '#/components/verification/types'

export function VerificationCheck({
  verified,
  verifier,
  ...rest
}: Props & SimpleVerificationState) {
  if (!verified) return null

  return verifier ? (
    // TODO
    <VerifierCheck {...rest} />
  ) : (
    <VerifiedCheck {...rest} />
  )
}
