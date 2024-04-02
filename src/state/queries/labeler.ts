import {AppBskyLabelerDefs} from '@atproto/api'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {z} from 'zod'

import {STALE} from '#/state/queries'
import {preferencesQueryKey} from '#/state/queries/preferences'
import {getAgent} from '#/state/session'

export const labelerInfoQueryKey = (did: string) => ['labeler-info', did]
export const labelersInfoQueryKey = (dids: string[]) => [
  'labelers-info',
  dids.sort(),
]
export const labelersDetailedInfoQueryKey = (dids: string[]) => [
  'labelers-detailed-info',
  dids,
]

export function useLabelerInfoQuery({
  did,
  enabled,
}: {
  did?: string
  enabled?: boolean
}) {
  return useQuery({
    enabled: !!did && enabled !== false,
    queryKey: labelerInfoQueryKey(did as string),
    queryFn: async () => {
      const res = await getAgent().app.bsky.labeler.getServices({
        dids: [did as string],
        detailed: true,
      })
      return res.data.views[0] as AppBskyLabelerDefs.LabelerViewDetailed
    },
  })
}

export function useLabelersInfoQuery({dids}: {dids: string[]}) {
  return useQuery({
    enabled: !!dids.length,
    queryKey: labelersInfoQueryKey(dids),
    queryFn: async () => {
      const res = await getAgent().app.bsky.labeler.getServices({dids})
      return res.data.views as AppBskyLabelerDefs.LabelerView[]
    },
  })
}

export function useLabelersDetailedInfoQuery({dids}: {dids: string[]}) {
  return useQuery({
    enabled: !!dids.length,
    queryKey: labelersDetailedInfoQueryKey(dids),
    gcTime: 1000 * 60 * 60 * 6, // 6 hours
    staleTime: STALE.MINUTES.ONE,
    queryFn: async () => {
      const res = await getAgent().app.bsky.labeler.getServices({
        dids,
        detailed: true,
      })
      return res.data.views as AppBskyLabelerDefs.LabelerViewDetailed[]
    },
  })
}

export function useLabelerSubscriptionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    async mutationFn({did, subscribe}: {did: string; subscribe: boolean}) {
      // TODO
      z.object({
        did: z.string(),
        subscribe: z.boolean(),
      }).parse({did, subscribe})

      if (subscribe) {
        await getAgent().addLabeler(did)
      } else {
        await getAgent().removeLabeler(did)
      }
    },
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}
