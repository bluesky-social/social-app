import {AppBskyActorDefs, type AppBskyActorGetProfile} from '@atproto/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {until} from '#/lib/async/until'
import {logger} from '#/logger'
import {updateProfileShadow} from '#/state/cache/profile-shadow'
import {useAgent, useSession} from '#/state/session'
import * as bsky from '#/types/bsky'

export function useVerificationCreateMutation() {
  const qc = useQueryClient()
  const agent = useAgent()
  const {currentAccount} = useSession()

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
          `useVerificationCreateMutation profile-cache update failed`,
          {
            safeMessage: e,
          },
        )
      }
    },
  })
}
