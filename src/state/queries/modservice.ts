import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'

import {getAgent} from '#/state/session'
import {preferencesQueryKey} from '#/state/queries/preferences'

export const modServiceInfoQueryKey = (did: string) => ['mod-service-info', did]

export function useModServiceInfoQuery({did}: {did: string}) {
  return useQuery({
    queryKey: modServiceInfoQueryKey(did),
    queryFn: async () => {
      const res = await getAgent().app.bsky.moderation.getService({did})
      return res.data
    },
  })
}

export function useModServiceSubscriptionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    async mutationFn({did, subscribe}: {did: string; subscribe: boolean}) {
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
      await getAgent().setModServiceEnabled(did, enabled)
    },
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}
