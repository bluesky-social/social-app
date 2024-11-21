import {useMutation, useQueryClient} from '@tanstack/react-query'

import {AppNux, Nux} from '#/state/queries/nuxs/definitions'
import {parseAppNux, serializeAppNux} from '#/state/queries/nuxs/util'
import {
  preferencesQueryKey,
  usePreferencesQuery,
} from '#/state/queries/preferences'
import {useAgent} from '#/state/session'

export {Nux} from '#/state/queries/nuxs/definitions'

export function useNuxs() {
  const {data, isSuccess} = usePreferencesQuery()

  if (data && isSuccess) {
    const nuxs = data.bskyAppState.nuxs
      ?.map(parseAppNux)
      ?.filter(Boolean) as AppNux[]

    if (nuxs) {
      return {
        nuxs,
        isSuccess,
      }
    }
  }

  return {
    nuxs: undefined,
    isSuccess,
  }
}

export function useNux<T extends Nux>(id: T) {
  const {nuxs, isSuccess} = useNuxs()

  if (nuxs && isSuccess) {
    const nux = nuxs.find(nux => nux.id === id)

    if (nux) {
      return {
        nux: nux as Extract<AppNux, {id: T}>,
        isSuccess,
      }
    }
  }

  return {
    nux: undefined,
    isSuccess,
  }
}

export function useUpsertNuxMutation() {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation({
    retry: 3,
    mutationFn: async (nux: AppNux) => {
      await agent.bskyAppUpsertNux(serializeAppNux(nux))
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useRemoveNuxsMutation() {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation({
    retry: 3,
    mutationFn: async (ids: string[]) => {
      await agent.bskyAppRemoveNuxs(ids)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}
