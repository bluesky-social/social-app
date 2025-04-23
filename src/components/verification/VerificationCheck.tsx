import {createIconSet} from '@expo/vector-icons'
import {useFonts} from 'expo-font'

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

export function loadVerificationCheckFonts() {
  return useFonts({
    Verification: require('../../../assets/fonts/verification/Verification.ttf'),
  })
}

export const VerificationCheckIcon = createIconSet(
  {
    'Verification-verifiedCheck': 59905,
    'Verification-verifiedCheckGray': 59906,
    'Verification-verifierCheck': 59907,
    'Verification-verifierCheckGray': 59908,
  },
  'Verification',
  'Verification.ttf',
)
