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

export function useModServiceInfoQuery({did}: {did: string}) {
  return useQuery({
    queryKey: modServiceInfoQueryKey(did),
    queryFn: async () => {
      const res = await getAgent().app.bsky.moderation.getService({did})
      return res.data
    },
  })
}

export function useModServicesInfoQuery({dids}: {dids: string[]}) {
  return useQuery({
    enabled: !!dids.length,
    queryKey: modServicesInfoQueryKey(dids),
    queryFn: async () => {
      const res = await getAgent().app.bsky.moderation.getServices({dids})
      return res.data.views
    },
  })
}

export function useModServicesDetailedInfoQuery({dids}: {dids: string[]}) {
  return useQuery({
    queryKey: modServicesDetailedInfoQueryKey(dids),
    queryFn: async () => {
      const views: AppBskyModerationDefs.ModServiceViewDetailed[] = []

      await Promise.all(
        dids.map(did => {
          return getAgent()
            .app.bsky.moderation.getService({did})
            .then(res => {
              views.push(res.data)
            })
            .catch(e => {
              console.error(e)
              return null
            })
        }),
      )

      return views
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

export function useModServiceEnableMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    async mutationFn({did, enabled}: {did: string; enabled: boolean}) {
      // TODO
      z.object({
        did: z.string(),
        enabled: z.boolean(),
      }).parse({did, enabled})
      await getAgent().setModServiceEnabled(did, enabled)
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useModServiceLabelGroupEnableMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    async mutationFn({
      did,
      group,
      enabled,
    }: {
      did: string
      group: string
      enabled: boolean
    }) {
      // TODO
      z.object({
        did: z.string(),
        group: z.string(),
        enabled: z.boolean(),
      }).parse({did, group, enabled})
      await getAgent().setModServiceLabelGroupEnabled(did, group, enabled)
    },
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}
