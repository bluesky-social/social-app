import {type AppBskyActorDefs} from '@atproto/api'
import {useQuery} from '@tanstack/react-query'

import {TRUSTED_VERIFIER_DIDS} from '#/lib/constants'
import {getVerificationBacklinks} from '#/lib/verification/constellation'
import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'

const TRUSTED = new Set(TRUSTED_VERIFIER_DIDS)

/**
 * Whether a DID is one of our trusted verifiers. The trust root is hardcoded
 * for now - see TRUSTED_VERIFIER_DIDS in constants for the migration path.
 */
export function isTrustedVerifier(did?: string): boolean {
  return !!did && TRUSTED.has(did)
}

export type MuVerification = {
  /**
   * Verifications of this subject issued by one of our trusted verifiers. These
   * carry `isValid: true` and an empty `createdAt`: the backlink index gives us
   * the record's identity but not its body, so strict validity and the creation
   * date are resolved lazily where the record is actually fetched (the dialog).
   */
  verifications: AppBskyActorDefs.VerificationView[]
  /** Whether this subject is itself a trusted verifier. */
  isVerifier: boolean
}

const muVerificationQueryKeyRoot = 'mu-verification'
export const createMuVerificationQueryKey = (did: string) =>
  createQueryKey(muVerificationQueryKeyRoot, {did})

export function useMuVerificationQuery({did}: {did?: string}) {
  return useQuery<MuVerification>({
    queryKey: createMuVerificationQueryKey(did ?? ''),
    enabled: !!did,
    staleTime: STALE.MINUTES.FIVE,
    queryFn: async () => {
      const backlinks = did ? await getVerificationBacklinks(did) : []
      const verifications = backlinks
        .filter(b => isTrustedVerifier(b.issuer))
        .map(b => ({
          issuer: b.issuer,
          uri: b.uri,
          isValid: true,
          createdAt: '',
        }))
      return {
        verifications,
        isVerifier: isTrustedVerifier(did),
      }
    },
  })
}
