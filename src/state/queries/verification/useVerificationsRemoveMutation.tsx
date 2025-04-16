import {AppBskyActorDefs,type AppBskyActorGetProfile, AtUri} from '@atproto/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {until} from '#/lib/async/until'
import {RQKEY_ROOT as postThreadQueryKeyRoot} from '#/state/queries/post-thread'
import {
  profilesQueryKeyRoot,
  RQKEY as profileQueryKey,
} from '#/state/queries/profile'
import {useAgent, useSession} from '#/state/session'
import * as bsky from '#/types/bsky'

export function useVerificationsRemoveMutation() {
  const qc = useQueryClient()
  const agent = useAgent()
  const {currentAccount} = useSession()

  return useMutation({
    async mutationFn({
      did,
      verifications,
    }: {
      did: string
      verifications: AppBskyActorDefs.VerificationView[]
    }) {
      if (!currentAccount) {
        throw new Error('User not logged in')
      }

      const uris = verifications.map(v => v.uri)

      await Promise.all(
        uris.map(uri => {
          const rkey = new AtUri(uri).rkey
          console.log('delete', rkey)
          // agent.app.bsky.graph.verification.delete({
          //   repo: currentAccount.did,
          //   rkey: new AtUri(uri).rkey,
          // }),
        }),
      )

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
            profile.verification.verifications.every(v => !uris.includes(v.uri))
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
