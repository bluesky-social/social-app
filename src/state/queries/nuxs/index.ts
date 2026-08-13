import {removeNuxs, upsertNux} from '@bsky.app/sdk'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {type AppNux, type Nux} from '#/state/queries/nuxs/definitions'
import {parseAppNux, serializeAppNux} from '#/state/queries/nuxs/util'
import {
  preferencesQueryKey,
  usePreferencesQuery,
} from '#/state/queries/preferences'
import {usePdsClient} from '#/state/session'
import {type app} from '#/lexicons'

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

  // if (__DEV__) {
  //   const queryClient = useQueryClient()
  //   const pdsClient = usePdsClient()

  //   // @ts-ignore
  //   window.clearNux = async (ids: string[]) => {
  //     await pdsClient.call(removeNuxs, ids)
  //     // triggers a refetch
  //     await queryClient.invalidateQueries({
  //       queryKey: preferencesQueryKey,
  //     })
  //   }
  // }

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
  const pdsClient = usePdsClient()

  return useMutation({
    retry: 3,
    mutationFn: async (nux: AppNux) => {
      /*
       * `serializeAppNux` still returns the legacy `Nux`, whose strings are
       * unbranded; it is validated against the same schema the action expects.
       */
      await pdsClient.call(
        upsertNux,
        serializeAppNux(nux) as app.bsky.actor.defs.Nux,
      )
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useResetNuxs() {
  const queryClient = useQueryClient()
  const pdsClient = usePdsClient()

  return useMutation({
    retry: 3,
    mutationFn: async (ids: string[]) => {
      await pdsClient.call(removeNuxs, ids)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}
