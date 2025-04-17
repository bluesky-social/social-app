import {type AppBskyActorGetProfile} from '@atproto/api'
import {useMutation} from '@tanstack/react-query'

import {until} from '#/lib/async/until'
import {useUpdateProfileVerificationCache} from '#/state/queries/verification/useUpdateProfileVerificationCache'
import {useAgent, useSession} from '#/state/session'
import type * as bsky from '#/types/bsky'

export function useVerificationCreateMutation() {
  const agent = useAgent()
  const {currentAccount} = useSession()
  const updateProfileVerificationCache = useUpdateProfileVerificationCache()

  return useMutation({
    async mutationFn({profile}: {profile: bsky.profile.AnyProfileView}) {
      if (!currentAccount) {
        throw new Error('User not logged in')
      }

      const uri = ''
      const {did, handle, displayName} = profile
      console.log('create', {handle, displayName})
      // const {uri} = await agent.app.bsky.graph.verification.create(
      //   {repo: currentAccount.did},
      //   {
      //     subject: did,
      //     createdAt: new Date().toISOString(),
      //     handle,
      //     displayName,
      //   },
      // )

      await until(
        5,
        1e3,
        ({data: profile}: AppBskyActorGetProfile.Response) => {
          if (
            profile.verification &&
            profile.verification.verifications.find(v => v.uri === uri)
          ) {
            return true
          }
          return false
        },
        () => {
          return agent.getProfile({actor: did ?? ''})
        },
      )
    },
    async onSuccess(_, {profile}) {
      await updateProfileVerificationCache({profile})
    },
  })
}
