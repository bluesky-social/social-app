import {type QueryClient, queryOptions, useQuery} from '@tanstack/react-query'

import {
  type ResolveClients,
  type ResolvedLink,
  resolveGif,
  resolveLink,
} from '#/lib/api/resolve'
import {STALE} from '#/state/queries/index'
import {useChatClient, useLexClient} from '#/state/session'
import {type Gif} from '#/features/gifPicker/types'

export const RQKEY_LINK_ROOT = 'resolve-link'
export const RQKEY_LINK = (url: string) => [RQKEY_LINK_ROOT, url]

export const RQKEY_GIF_ROOT = 'resolve-gif'
export const RQKEY_GIF = (url: string) => [RQKEY_GIF_ROOT, url]

export function resolveLinkQueryOptions(clients: ResolveClients, url: string) {
  return queryOptions({
    staleTime: STALE.HOURS.ONE,
    queryKey: RQKEY_LINK(url),
    queryFn: () => resolveLink(clients, url),
  })
}

/**
 * Bundle the clients the link resolver needs from the session hooks. The
 * appview client serves the `app.bsky.*` reads and handle resolution, and the
 * chat client serves group join-link previews.
 */
export function useResolveClients(): ResolveClients {
  const appview = useLexClient()
  const chat = useChatClient()
  return {appview, chat}
}

export function useResolveLinkQuery(url: string) {
  const clients = useResolveClients()
  return useQuery(resolveLinkQueryOptions(clients, url))
}
export function fetchResolveLinkQuery(
  queryClient: QueryClient,
  clients: ResolveClients,
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
