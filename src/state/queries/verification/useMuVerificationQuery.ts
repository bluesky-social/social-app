import {type AppBskyActorDefs} from '@atproto/api'
import {useQuery, useQueryClient} from '@tanstack/react-query'

import {getVerificationBacklinks} from '#/lib/verification/constellation'
import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {ensureTrustedVerifierDids} from '#/state/queries/verification/useTrustedVerifiersQuery'
import {useAgent} from '#/state/session'

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
  const qc = useQueryClient()
  const agent = useAgent()
  return useQuery<MuVerification>({
    queryKey: createMuVerificationQueryKey(did ?? ''),
    enabled: !!did,
    staleTime: STALE.MINUTES.FIVE,
    queryFn: async () => {
      const trusted = await ensureTrustedVerifierDids(qc, agent)
      const backlinks = did ? await getVerificationBacklinks(did) : []
      const verifications = backlinks
        .filter(b => trusted.has(b.issuer))
        .map(b => ({
          issuer: b.issuer,
          uri: b.uri,
          isValid: true,
          createdAt: '',
        }))
      return {
        verifications,
        isVerifier: !!did && trusted.has(did),
      }
    },
  })
}
