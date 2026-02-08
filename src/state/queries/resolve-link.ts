import {type BskyAgent} from '@atproto/api'
import {type QueryClient, useQuery} from '@tanstack/react-query'

import {type ResolvedLink, resolveGif, resolveLink} from '#/lib/api/resolve'
import {STALE} from '#/state/queries/index'
import {useAgent} from '#/state/session'
import {type Gif} from './tenor'

const RQKEY_LINK_ROOT = 'resolve-link'
export const RQKEY_LINK = (url: string) => [RQKEY_LINK_ROOT, url]

const RQKEY_GIF_ROOT = 'resolve-gif'
export const RQKEY_GIF = (url: string) => [RQKEY_GIF_ROOT, url]

export function useResolveLinkQuery(url: string) {
  const agent = useAgent()

  return useQuery({
    staleTime: STALE.HOURS.ONE,
    queryKey: RQKEY_LINK(url),
    queryFn: async () => {
      return await resolveLink(agent, url)
    },
  })
}
export function fetchResolveLinkQuery(
  queryClient: QueryClient,
  agent: BskyAgent,
  url: string,
) {
  return queryClient.fetchQuery({
    staleTime: STALE.HOURS.ONE,
    queryKey: RQKEY_LINK(url),
    queryFn: async () => {
      return await resolveLink(agent, url)
    },
  })
}
export function precacheResolveLinkQuery(
  queryClient: QueryClient,
  url: string,
  resolvedLink: ResolvedLink,
) {
  queryClient.setQueryData(RQKEY_LINK(url), resolvedLink)
}

export function useResolveGifQuery(gif: Gif) {
  const agent = useAgent()
  return useQuery({
    staleTime: STALE.HOURS.ONE,
    queryKey: RQKEY_GIF(gif.url),
    queryFn: async () => {
      return await resolveGif(agent, gif)
    },
  })
}
export function fetchResolveGifQuery(
  queryClient: QueryClient,
  agent: BskyAgent,
  gif: Gif,
) {
  return queryClient.fetchQuery({
    staleTime: STALE.HOURS.ONE,
    queryKey: RQKEY_GIF(gif.url),
    queryFn: async () => {
      return await resolveGif(agent, gif)
    },
  })
}
