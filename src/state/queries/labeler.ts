import {AppBskyLabelerDefs} from '@atproto/api'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {z} from 'zod'

import {MAX_LABELERS} from '#/lib/constants'
import {labelersDetailedInfoQueryKeyRoot} from '#/lib/react-query'
import {STALE} from '#/state/queries'
import {
  preferencesQueryKey,
  usePreferencesQuery,
} from '#/state/queries/preferences'
import {useAgent} from '#/state/session'

const labelerInfoQueryKeyRoot = 'labeler-info'
export const labelerInfoQueryKey = (did: string) => [
  labelerInfoQueryKeyRoot,
  did,
]

const labelersInfoQueryKeyRoot = 'labelers-info'
export const labelersInfoQueryKey = (dids: string[]) => [
  labelersInfoQueryKeyRoot,
  dids.slice().sort(),
]

export const labelersDetailedInfoQueryKey = (dids: string[]) => [
  labelersDetailedInfoQueryKeyRoot,
  dids,
]

export function useLabelerInfoQuery({
  did,
  enabled,
}: {
  did?: string
  enabled?: boolean
}) {
  const agent = useAgent()
  return useQuery({
    enabled: !!did && enabled !== false,
    queryKey: labelerInfoQueryKey(did as string),
    queryFn: async () => {
      const res = await agent.app.bsky.labeler.getServices({
        dids: [did as string],
        detailed: true,
      })
      return res.data.views[0] as AppBskyLabelerDefs.LabelerViewDetailed
    },
  })
}

export function useLabelersInfoQuery({dids}: {dids: string[]}) {
  const agent = useAgent()
  return useQuery({
    enabled: !!dids.length,
    queryKey: labelersInfoQueryKey(dids),
    queryFn: async () => {
      const res = await agent.app.bsky.labeler.getServices({dids})
      return res.data.views as AppBskyLabelerDefs.LabelerView[]
    },
  })
}

export function useLabelersDetailedInfoQuery({dids}: {dids: string[]}) {
  const agent = useAgent()
  return useQuery({
    enabled: !!dids.length,
    queryKey: labelersDetailedInfoQueryKey(dids),
    gcTime: 1000 * 60 * 60 * 6, // 6 hours
    staleTime: STALE.MINUTES.ONE,
    queryFn: async () => {
      const res = await agent.app.bsky.labeler.getServices({
        dids,
        detailed: true,
      })
      return res.data.views as AppBskyLabelerDefs.LabelerViewDetailed[]
    },
  })
}

export function useLabelerSubscriptionMutation() {
  const queryClient = useQueryClient()
  const agent = useAgent()
  const preferences = usePreferencesQuery()

  return useMutation({
    async mutationFn({did, subscribe}: {did: string; subscribe: boolean}) {
      // TODO
      z.object({
        did: z.string(),
        subscribe: z.boolean(),
      }).parse({did, subscribe})

      /**
       * If a user has invalid/takendown/deactivated labelers, we need to
       * remove them. We don't have a great way to do this atm on the server,
       * so we do it here.
       *
       * We also need to push validation into this method, since we need to
       * check {@link MAX_LABELERS} _after_ we've removed invalid or takendown
       * labelers.
       */
      const labelerDids = (
        preferences.data?.moderationPrefs?.labelers ?? []
      ).map(l => l.did)
      const invalidLabelers: string[] = []
      if (labelerDids.length) {
        const profiles = await agent.getProfiles({actors: labelerDids})
        if (profiles.data) {
          for (const did of labelerDids) {
            const exists = profiles.data.profiles.find(p => p.did === did)
            if (exists) {
              // profile came back but it's not a valid labeler
              if (exists.associated && !exists.associated.labeler) {
                invalidLabelers.push(did)
              }
            } else {
              // no response came back, might be deactivated or takendown
              invalidLabelers.push(did)
            }
          }
        }
      }
      if (invalidLabelers.length) {
        await Promise.all(invalidLabelers.map(did => agent.removeLabeler(did)))
      }

      if (subscribe) {
        const labelerCount = labelerDids.length - invalidLabelers.length
        if (labelerCount >= MAX_LABELERS) {
          throw new Error('MAX_LABELERS')
        }
        await agent.addLabeler(did)
      } else {
        await agent.removeLabeler(did)
      }
    },
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}
