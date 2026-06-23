import {type AppBskyActorDefs, AtUri} from '@atproto/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {
  createMuVerificationQueryKey,
  type MuVerification,
} from '#/state/queries/verification/useMuVerificationQuery'
import {useAgent, useSession} from '#/state/session'
import {useAnalytics} from '#/analytics'
import type * as bsky from '#/types/bsky'

// See useVerificationCreateMutation: optimistic update + delayed reconcile to
// cover Constellation's firehose indexing lag.
const CONSTELLATION_INDEX_DELAY = 8e3

export function useVerificationsRemoveMutation() {
  const ax = useAnalytics()
  const agent = useAgent()
  const qc = useQueryClient()
  const {currentAccount} = useSession()

  return useMutation({
    async mutationFn({
      verifications,
    }: {
      profile: bsky.profile.AnyProfileView
      verifications: AppBskyActorDefs.VerificationView[]
    }) {
      if (!currentAccount) {
        throw new Error('User not logged in')
      }

      const uris = verifications.map(v => v.uri)

      await Promise.all(
        uris.map(uri => {
          return agent.app.bsky.graph.verification.delete({
            repo: currentAccount.did,
            rkey: new AtUri(uri).rkey,
          })
        }),
      )

      return {uris}
    },
    onSuccess({uris}, {profile}) {
      ax.metric('verification:revoke', {})

      const key = createMuVerificationQueryKey(profile.did)
      qc.setQueryData<MuVerification>(key, prev => {
        if (!prev) return prev
        return {
          ...prev,
          verifications: prev.verifications.filter(v => !uris.includes(v.uri)),
        }
      })
      setTimeout(() => {
        void qc.invalidateQueries({queryKey: key})
      }, CONSTELLATION_INDEX_DELAY)
    },
  })
}
