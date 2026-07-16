import {type QueryClient, queryOptions, useQuery} from '@tanstack/react-query'

import {type ResolvedLink, resolveGif, resolveLink} from '#/lib/api/resolve'
import {STALE} from '#/state/queries/index'
import {type SessionAgent, useAgent} from '#/state/session'
import {type Gif} from '#/features/gifPicker/types'

export const RQKEY_LINK_ROOT = 'resolve-link'
export const RQKEY_LINK = (url: string) => [RQKEY_LINK_ROOT, url]

export const RQKEY_GIF_ROOT = 'resolve-gif'
export const RQKEY_GIF = (url: string) => [RQKEY_GIF_ROOT, url]

export function resolveLinkQueryOptions(agent: SessionAgent, url: string) {
  return queryOptions({
    staleTime: STALE.HOURS.ONE,
    queryKey: RQKEY_LINK(url),
    queryFn: () => resolveLink(agent, url),
  })
}

export function useResolveLinkQuery(url: string) {
  const agent = useAgent()
  return useQuery(resolveLinkQueryOptions(agent, url))
}
export function fetchResolveLinkQuery(
  queryClient: QueryClient,
  agent: SessionAgent,
  url: string,
) {
  return queryClient.fetchQuery(resolveLinkQueryOptions(agent, url))
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
  agent: SessionAgent,
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
