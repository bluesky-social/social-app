import {
  type AppBskyActorDefs,
  type AppBskyActorGetProfile,
  AtUri,
} from '@atproto/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {until} from '#/lib/async/until'
import {logger} from '#/logger'
import {
  useBlackskyVerificationEnabled,
  useBlackskyVerificationTrusted,
} from '#/state/preferences/blacksky-verification'
import {useConstellationInstance} from '#/state/preferences/constellation-instance'
import {useUpdateProfileVerificationCache} from '#/state/queries/verification/useUpdateProfileVerificationCache'
import {useAgent, useSession} from '#/state/session'
import type * as bsky from '#/types/bsky'
import {
  getTrustedConstellationVerifications,
  RQKEY as BLACKSKY_VERIFICATION_RQKEY,
} from '../blacksky-verification'
import {
  asUri,
  asyncGenCollect,
  asyncGenFilter,
  type ConstellationLink,
} from '../constellation'

export function useVerificationsRemoveMutation() {
  const agent = useAgent()
  const {currentAccount} = useSession()
  const updateProfileVerificationCache = useUpdateProfileVerificationCache()

  const qc = useQueryClient()
  const blackskyVerificationEnabled = useBlackskyVerificationEnabled()
  const blackskyVerificationTrusted = useBlackskyVerificationTrusted(
    currentAccount?.did,
  )
  const constellationInstance = useConstellationInstance()

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

      const uris = new Set(verifications.map(v => v.uri))

      await Promise.all(
        Array.from(uris).map(uri => {
          return agent.app.bsky.graph.verification.delete({
            repo: currentAccount.did,
            rkey: new AtUri(uri).rkey,
          })
        }),
      )

      if (blackskyVerificationEnabled) {
        await until(
          10,
          2e3,
          (link: ConstellationLink[]) => {
            return link.length === 0
          },
          () =>
            asyncGenCollect(
              asyncGenFilter(
                getTrustedConstellationVerifications(
                  constellationInstance,
                  profile.did,
                  blackskyVerificationTrusted,
                ),
                link => uris.has(asUri(link)),
              ),
            ),
        )
      } else {
        await until(
          5,
          1e3,
          ({data: profile}: AppBskyActorGetProfile.Response) => {
            if (
              !profile.verification?.verifications.some(v => uris.has(v.uri))
            ) {
              return true
            }
            return false
          },
          () => {
            return agent.getProfile({actor: profile.did ?? ''})
          },
        )
      }
    },
    async onSuccess(_, {profile}) {
      logger.metric('verification:revoke', {}, {statsig: true})
      await updateProfileVerificationCache({profile})
      qc.invalidateQueries({
        queryKey: BLACKSKY_VERIFICATION_RQKEY(
          profile.did,
          blackskyVerificationTrusted,
        ),
      })
    },
  })
}
