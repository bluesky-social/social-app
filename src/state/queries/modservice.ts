import {z} from 'zod'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {AppBskyModerationDefs} from '@atproto/api'

import {getAgent} from '#/state/session'
import {preferencesQueryKey} from '#/state/queries/preferences'

export const modServiceInfoQueryKey = (did: string) => ['mod-service-info', did]
export const modServicesInfoQueryKey = (dids: string[]) => [
  'mod-services-info',
  dids,
]
export const modServicesDetailedInfoQueryKey = (dids: string[]) => [
  'mod-services-detailed-info',
  dids,
]

export function useModServiceInfoQuery({
  did,
  enabled,
}: {
  did?: string
  enabled?: boolean
}) {
  return useQuery({
    enabled: !!did && enabled !== false,
    queryKey: modServiceInfoQueryKey(did as string),
    queryFn: async () => {
      const res = await getAgent().app.bsky.moderation.getServices({
        dids: [did as string],
        detailed: true,
      })
      return res.data.views[0] as AppBskyModerationDefs.ModServiceViewDetailed
    },
  })
}

export function useModServicesInfoQuery({dids}: {dids: string[]}) {
  return useQuery({
    enabled: !!dids.length,
    queryKey: modServicesInfoQueryKey(dids),
    queryFn: async () => {
      const res = await getAgent().app.bsky.moderation.getServices({dids})
      return res.data.views as AppBskyModerationDefs.ModServiceView[]
    },
  })
}

export function useModServicesDetailedInfoQuery({dids}: {dids: string[]}) {
  return useQuery({
    enabled: !!dids.length,
    queryKey: modServicesDetailedInfoQueryKey(dids),
    queryFn: async () => {
      const res = await getAgent().app.bsky.moderation.getServices({
        dids,
        detailed: true,
      })
      return res.data.views as AppBskyModerationDefs.ModServiceViewDetailed[]
    },
  })
}

export function useModServiceSubscriptionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    async mutationFn({did, subscribe}: {did: string; subscribe: boolean}) {
      // TODO
      z.object({
        did: z.string(),
        subscribe: z.boolean(),
      }).parse({did, subscribe})

      if (subscribe) {
        await getAgent().addModService(did)
      } else {
        await getAgent().removeModService(did)
      }
    },
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}
