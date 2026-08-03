import {type AtUriString} from '@atproto/syntax'
import {deleteLike, like} from '@bsky.app/sdk'
import {useMutation} from '@tanstack/react-query'

import {usePdsClient} from '#/state/session'

export function useLikeMutation() {
  const pdsClient = usePdsClient()
  return useMutation({
    mutationFn: async ({uri, cid}: {uri: string; cid: string}) => {
      const res = await pdsClient.call(like, {
        uri: uri as AtUriString,
        cid,
      })
      return {uri: res.uri}
    },
  })
}

export function useUnlikeMutation() {
  const pdsClient = usePdsClient()
  return useMutation({
    mutationFn: async ({uri}: {uri: string}) => {
      await pdsClient.call(deleteLike, uri as AtUriString)
    },
  })
}
