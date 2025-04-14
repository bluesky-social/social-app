import {type Props} from '#/components/icons/common'
import {VerificationCheck as VerifiedIcon} from '#/components/icons/VerificationCheck'
import {type SimpleVerificationState} from '#/components/verification/types'

export function VerificationCheck({
  verified,
  verifier,
  ...rest
}: Props & SimpleVerificationState) {
  if (!verified) return null

  return verifier ? (
    // TODO
    <VerifiedIcon {...rest} />
  ) : (
    <VerifiedIcon {...rest} />
  )
}
