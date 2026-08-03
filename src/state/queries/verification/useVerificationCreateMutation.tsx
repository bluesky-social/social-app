import {
  type AtIdentifierString,
  type DidString,
  type HandleString,
  toDatetimeString,
} from '@atproto/syntax'
import {useMutation} from '@tanstack/react-query'

import {until} from '#/lib/async/until'
import {useUpdateProfileVerificationCache} from '#/state/queries/verification/useUpdateProfileVerificationCache'
import {useAppviewClient, usePdsClient, useSession} from '#/state/session'
import {useAnalytics} from '#/analytics'
import {app} from '#/lexicons'
import type * as bsky from '#/types/bsky'

export function useVerificationCreateMutation() {
  const ax = useAnalytics()
  const appviewClient = useAppviewClient()
  const pdsClient = usePdsClient()
  const {currentAccount} = useSession()
  const updateProfileVerificationCache = useUpdateProfileVerificationCache()

  return useMutation({
    async mutationFn({profile}: {profile: bsky.profile.AnyProfileView}) {
      if (!currentAccount) {
        throw new Error('User not logged in')
      }

      const {uri} = await pdsClient.create(app.bsky.graph.verification, {
        // the profile view is still legacy-typed, so its strings are unbranded
        subject: profile.did as DidString,
        createdAt: toDatetimeString(new Date()),
        handle: profile.handle as HandleString,
        displayName: profile.displayName || '',
      })

      await until(
        5,
        1e3,
        (profile: app.bsky.actor.getProfile.$OutputBody) => {
          if (
            profile.verification &&
            profile.verification.verifications.find(v => v.uri === uri)
          ) {
            return true
          }
          return false
        },
        () => {
          return appviewClient.call(app.bsky.actor.getProfile, {
            actor: (profile.did ?? '') as AtIdentifierString,
          })
        },
      )
    },
    async onSuccess(_, {profile}) {
      ax.metric('verification:create', {})
      await updateProfileVerificationCache({profile})
    },
  })
}
