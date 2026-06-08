import {useMutation, useQueryClient} from '@tanstack/react-query'

import {
  createMuVerificationQueryKey,
  type MuVerification,
} from '#/state/queries/verification/useMuVerificationQuery'
import {useAgent, useSession} from '#/state/session'
import {useAnalytics} from '#/analytics'
import type * as bsky from '#/types/bsky'

// Constellation indexes new records off the firehose with a few seconds of lag,
// so after writing we update the cache optimistically and reconcile shortly
// after. Bluesky's AppView will never reflect our verification (our issuer is
// not in its trusted set), so we no longer poll getProfile.
const CONSTELLATION_INDEX_DELAY = 8e3

export function useVerificationCreateMutation() {
  const ax = useAnalytics()
  const agent = useAgent()
  const qc = useQueryClient()
  const {currentAccount} = useSession()

  return useMutation({
    async mutationFn({profile}: {profile: bsky.profile.AnyProfileView}) {
      if (!currentAccount) {
        throw new Error('User not logged in')
      }

      const createdAt = new Date().toISOString()
      const {uri} = await agent.app.bsky.graph.verification.create(
        {repo: currentAccount.did},
        {
          subject: profile.did,
          createdAt,
          handle: profile.handle,
          displayName: profile.displayName || '',
        },
      )
      return {uri, createdAt}
    },
    onSuccess({uri, createdAt}, {profile}) {
      ax.metric('verification:create', {})
      if (!currentAccount) return

      const key = createMuVerificationQueryKey(profile.did)
      qc.setQueryData<MuVerification>(key, prev => {
        const next: MuVerification = prev ?? {
          verifications: [],
          isVerifier: false,
        }
        if (next.verifications.some(v => v.uri === uri)) return next
        return {
          ...next,
          verifications: [
            {issuer: currentAccount.did, uri, isValid: true, createdAt},
            ...next.verifications,
          ],
        }
      })
      setTimeout(() => {
        void qc.invalidateQueries({queryKey: key})
      }, CONSTELLATION_INDEX_DELAY)
    },
  })
}
