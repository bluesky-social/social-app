import {type IconProps} from './icons/types.js'
import {VerifiedCheck} from './icons/VerifiedCheck.js'
import {VerifierCheck} from './icons/VerifierCheck.js'

export function VerificationCheck({
  verifier,
  ...rest
}: IconProps & {
  verifier?: boolean
}) {
  return verifier ? <VerifierCheck {...rest} /> : <VerifiedCheck {...rest} />
}
