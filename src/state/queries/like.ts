import {useMutation} from '@tanstack/react-query'

import {getAgent} from '#/state/session'

export function useLikeMutation() {
  return useMutation({
    mutationFn: async ({uri, cid}: {uri: string; cid: string}) => {
      const res = await getAgent().like(uri, cid)
      return {uri: res.uri}
    },
  })
}

export function useUnlikeMutation() {
  return useMutation({
    mutationFn: async ({uri}: {uri: string}) => {
      await getAgent().deleteLike(uri)
    },
  })
}
