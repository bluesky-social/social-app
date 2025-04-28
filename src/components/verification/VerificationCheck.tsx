import {type Props} from '#/components/icons/common'
import {VerifiedCheck} from '#/components/icons/VerifiedCheck'
import {VerifierCheck} from '#/components/icons/VerifierCheck'

export function VerificationCheck({
  verifier,
  ...rest
}: Props & {
  verifier?: boolean
}) {
  return verifier ? <VerifierCheck {...rest} /> : <VerifiedCheck {...rest} />
}
