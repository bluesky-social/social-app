import {AtUri} from '@atproto/syntax'
import {useMutation} from '@tanstack/react-query'

import {until} from '#/lib/async/until'
import {useUpdateProfileVerificationCache} from '#/state/queries/verification/useUpdateProfileVerificationCache'
import {useAppviewClient, usePdsClient, useSession} from '#/state/session'
import {useAnalytics} from '#/analytics'
import type * as AppBskyActorDefs from '#/lexicons/app/bsky/actor/defs'
import * as AppBskyActorGetProfile from '#/lexicons/app/bsky/actor/getProfile'
import * as AppBskyGraphVerification from '#/lexicons/app/bsky/graph/verification'
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
      verifications: AppBskyActorDefs.VerificationView[]
    }) {
      if (!currentAccount) {
        throw new Error('User not logged in')
      }

      const uris = verifications.map(v => v.uri)

      await Promise.all(
        uris.map(uri => {
          return pdsClient.delete(AppBskyGraphVerification, {
            rkey: new AtUri(uri).rkeySafe,
          })
        }),
      )

      await until(
        5,
        1e3,
        (profile: AppBskyActorGetProfile.$OutputBody) => {
          if (
            !profile.verification?.verifications.some(v => uris.includes(v.uri))
          ) {
            return true
          }
          return false
        },
        () => {
          return appviewClient.call(AppBskyActorGetProfile, {
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
