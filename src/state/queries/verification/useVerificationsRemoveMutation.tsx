import {
  AppBskyActorDefs,
  type AppBskyActorGetProfile,
  AtUri,
} from '@atproto/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {until} from '#/lib/async/until'
import {logger} from '#/logger'
import {updateProfileShadow} from '#/state/cache/profile-shadow'
import {useAgent, useSession} from '#/state/session'
import * as bsky from '#/types/bsky'

export function useVerificationsRemoveMutation() {
  const qc = useQueryClient()
  const agent = useAgent()
  const {currentAccount} = useSession()

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
          return agent.getProfile({actor: profile.did ?? ''})
        },
      )
    },
    async onSuccess(_, {profile}) {
      try {
        const {data: updated} = await agent.getProfile({
          actor: profile.did ?? '',
        })
        updateProfileShadow(qc, profile.did, {
          // @ts-expect-error TODO lexicons will fix this
          verification: updated.verification,
        })
      } catch (e) {
        logger.error(
          `useVerificationRemoveMutation profile-cache update failed`,
          {
            safeMessage: e,
          },
        )
      }
    },
  })
}
