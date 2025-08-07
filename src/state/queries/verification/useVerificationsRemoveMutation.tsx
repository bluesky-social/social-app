import {
  type AppGndrActorDefs,
  type AppGndrActorGetProfile,
  AtUri,
} from '@gander-social-atproto/api'
import {useMutation} from '@tanstack/react-query'

import {until} from '#/lib/async/until'
import {logger} from '#/logger'
import {useUpdateProfileVerificationCache} from '#/state/queries/verification/useUpdateProfileVerificationCache'
import {useAgent, useSession} from '#/state/session'
import type * as gndr from '#/types/gndr'

export function useVerificationsRemoveMutation() {
  const agent = useAgent()
  const {currentAccount} = useSession()
  const updateProfileVerificationCache = useUpdateProfileVerificationCache()

  return useMutation({
    async mutationFn({
      profile,
      verifications,
    }: {
      profile: gndr.profile.AnyProfileView
      verifications: AppGndrActorDefs.VerificationView[]
    }) {
      if (!currentAccount) {
        throw new Error('User not logged in')
      }

      const uris = verifications.map(v => v.uri)

      await Promise.all(
        uris.map(uri => {
          return agent.app.gndr.graph.verification.delete({
            repo: currentAccount.did,
            rkey: new AtUri(uri).rkey,
          })
        }),
      )

      await until(
        5,
        1e3,
        ({data: profile}: AppGndrActorGetProfile.Response) => {
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
