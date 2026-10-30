import {type QueryClient, queryOptions, useQuery} from '@tanstack/react-query'

import {
  type LinkResolvers,
  type ResolvedLink,
  resolveGif,
  resolveLink,
} from '#/lib/api/resolve'
import {STALE} from '#/state/queries/index'
import {useAppviewClient, useChatClient} from '#/state/session'
import {type Gif} from '#/features/gifPicker/types'

export const RQKEY_LINK_ROOT = 'resolve-link'
export const RQKEY_LINK = (url: string) => [RQKEY_LINK_ROOT, url]

export const RQKEY_GIF_ROOT = 'resolve-gif'
export const RQKEY_GIF = (url: string) => [RQKEY_GIF_ROOT, url]

export function resolveLinkQueryOptions(clients: LinkResolvers, url: string) {
  return queryOptions({
    staleTime: STALE.HOURS.ONE,
    queryKey: RQKEY_LINK(url),
    queryFn: () => resolveLink(clients, url),
  })
}

export function useResolveLinkQuery(url: string) {
  const appviewClient = useAppviewClient()
  const chatClient = useChatClient()
  return useQuery(resolveLinkQueryOptions({appviewClient, chatClient}, url))
}
export function fetchResolveLinkQuery(
  queryClient: QueryClient,
  clients: LinkResolvers,
  url: string,
) {
  return queryClient.fetchQuery(resolveLinkQueryOptions(clients, url))
}
export function precacheResolveLinkQuery(
  queryClient: QueryClient,
  url: string,
  resolvedLink: ResolvedLink,
) {
  queryClient.setQueryData(RQKEY_LINK(url), resolvedLink)
}

/*
 * GIF resolution is pure metadata work on a URL the picker already returned -
 * it makes no atproto request - so it takes no client.
 */
export function useResolveGifQuery(gif: Gif) {
  return useQuery({
    staleTime: STALE.HOURS.ONE,
    queryKey: RQKEY_GIF(gif.url),
    queryFn: async () => {
      return await resolveGif(gif)
    },
  })
}
export function fetchResolveGifQuery(queryClient: QueryClient, gif: Gif) {
  return queryClient.fetchQuery({
    staleTime: STALE.HOURS.ONE,
    queryKey: RQKEY_GIF(gif.url),
    queryFn: async () => {
      return await resolveGif(gif)
    },
  })
}
