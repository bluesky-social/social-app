import {AtUri} from '@atproto/syntax'
import {useMutation} from '@tanstack/react-query'

import {until} from '#/lib/async/until'
import {useUpdateProfileVerificationCache} from '#/state/queries/verification/useUpdateProfileVerificationCache'
import {useAppviewClient, usePdsClient, useSession} from '#/state/session'
import {useAnalytics} from '#/analytics'
import {app} from '#/lexicons'
import type * as bsky from '#/types/bsky'

export function useVerificationsRemoveMutation() {
  const ax = useAnalytics()
  const appviewClient = useAppviewClient()
  const pdsClient = usePdsClient()
  const {currentAccount} = useSession()
  const updateProfileVerificationCache = useUpdateProfileVerificationCache()

  return useMutation({
    async mutationFn({
      profile,
      verifications,
    }: {
      profile: bsky.profile.AnyProfileView
      verifications: app.bsky.actor.defs.VerificationView[]
    }) {
      if (!currentAccount) {
        throw new Error('User not logged in')
      }

      const uris = verifications.map(v => v.uri)

      await Promise.all(
        uris.map(uri => {
          return pdsClient.delete(app.bsky.graph.verification, {
            rkey: new AtUri(uri).rkey,
          })
        }),
      )

      await until(
        5,
        1e3,
        (profile: app.bsky.actor.getProfile.$OutputBody) => {
          if (
            !profile.verification?.verifications.some(v => uris.includes(v.uri))
          ) {
            return true
          }
          return false
        },
        () => {
          return appviewClient.call(app.bsky.actor.getProfile, {
            actor: profile.did ?? '',
          })
        },
      )
    },
    async onSuccess(_, {profile}) {
      ax.metric('verification:revoke', {})
      await updateProfileVerificationCache({profile})
    },
  })
}
