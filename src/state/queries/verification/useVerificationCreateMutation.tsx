import {type DatetimeString} from '@atproto/lex-schema'
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
        subject: profile.did,
        createdAt: new Date().toISOString() as DatetimeString,
        handle: profile.handle,
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
            actor: profile.did ?? '',
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
