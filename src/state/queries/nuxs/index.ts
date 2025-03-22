import {useMutation, useQueryClient} from '@tanstack/react-query'

import {AppNux, Nux, retiredNuxNames} from '#/state/queries/nuxs/definitions'
import {parseAppNux, serializeAppNux} from '#/state/queries/nuxs/util'
import {
  preferencesQueryKey,
  usePreferencesQuery,
} from '#/state/queries/preferences'
import {useAgent} from '#/state/session'

export {Nux} from '#/state/queries/nuxs/definitions'

export function useNuxs():
  | {
      nuxs: AppNux[]
      status: 'ready'
    }
  | {
      nuxs: undefined
      status: 'loading' | 'error'
    } {
  const {data, isSuccess, isError} = usePreferencesQuery()
  const status = isSuccess ? 'ready' : isError ? 'error' : 'loading'

  if (status === 'ready') {
    const nuxs = data?.bskyAppState?.nuxs
      ?.map(parseAppNux)
      ?.filter(Boolean) as AppNux[]

    if (nuxs) {
      return {
        nuxs,
        status,
      }
    } else {
      return {
        nuxs: [],
        status,
      }
    }
  }

  return {
    nuxs: undefined,
    status,
  }
}

export function useNux<T extends Nux>(
  id: T,
):
  | {
      nux: Extract<AppNux, {id: T}> | undefined
      status: 'ready'
    }
  | {
      nux: undefined
      status: 'loading' | 'error'
    } {
  const {nuxs, status} = useNuxs()

  if (status === 'ready') {
    const nux = nuxs.find(nux => nux.id === id)

    if (nux) {
      return {
        nux: nux as Extract<AppNux, {id: T}>,
        status,
      }
    } else {
      return {
        nux: undefined,
        status,
      }
    }
  }

  return {
    nux: undefined,
    status,
  }
}

export function useSaveNux() {
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
      // do not await, just cleaning up
      agent.bskyAppRemoveNuxs(retiredNuxNames).catch(() => {})
    },
  })
}

export function useResetNuxs() {
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
