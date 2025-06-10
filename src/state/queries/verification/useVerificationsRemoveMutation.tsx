import {
  type AppBskyActorDefs,
  type AppBskyActorGetProfile,
  AtUri,
} from '@atproto/api'
import {useMutation} from '@tanstack/react-query'

import {until} from '#/lib/async/until'
import {logger} from '#/logger'
import {useUpdateProfileVerificationCache} from '#/state/queries/verification/useUpdateProfileVerificationCache'
import {useAgent, useSession} from '#/state/session'
import type * as bsky from '#/types/bsky'

export function useVerificationsRemoveMutation() {
  const agent = useAgent()
  const {currentAccount} = useSession()
  const updateProfileVerificationCache = useUpdateProfileVerificationCache()

  return useMutation({
    async mutationFn({
      profile,
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

      await until(
        5,
        1e3,
        ({data: profile}: AppBskyActorGetProfile.Response) => {
          if (
            !profile.verification?.verifications.some(v => uris.includes(v.uri))
          ) {
            return true
          }
          return false
        },
        () => {
          return agent.getProfile({actor: profile.did ?? ''})
        },
      )
    },
    async onSuccess(_, {profile}) {
      logger.metric('verification:revoke', {}, {statsig: true})
      await updateProfileVerificationCache({profile})
    },
  })
}
