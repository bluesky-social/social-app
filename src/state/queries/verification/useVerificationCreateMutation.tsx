import {AppBskyActorDefs,type AppBskyActorGetProfile} from '@atproto/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {until} from '#/lib/async/until'
import {RQKEY_ROOT as postThreadQueryKeyRoot} from '#/state/queries/post-thread'
import {
  profilesQueryKeyRoot,
  RQKEY as profileQueryKey,
} from '#/state/queries/profile'
import {useAgent, useSession} from '#/state/session'
import * as bsky from '#/types/bsky'

export function useVerificationCreateMutation() {
  const qc = useQueryClient()
  const agent = useAgent()
  const {currentAccount} = useSession()

  return useMutation({
    async mutationFn({
      did,
      handle,
      displayName,
    }: {
      did: string
      handle: string
      displayName: string
    }) {
      if (!currentAccount) {
        throw new Error('User not logged in')
      }

      const uri = ''
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
            bsky.dangerousIsType<AppBskyActorDefs.VerificationStateDefault>(
              profile.verification,
              AppBskyActorDefs.isVerificationStateDefault,
            ) &&
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
    onSuccess(_, {did}) {
      // TODO where do we draw the line here
      qc.invalidateQueries({
        queryKey: profileQueryKey(did),
      })
      qc.invalidateQueries({
        queryKey: [profilesQueryKeyRoot],
      })
      qc.invalidateQueries({
        queryKey: [postThreadQueryKeyRoot],
      })
    },
  })
}
