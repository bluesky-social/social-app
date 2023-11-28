import {QueryClient, useQuery, UseQueryResult} from '@tanstack/react-query'
import {AtUri, AppBskyActorDefs, AppBskyFeedDefs} from '@atproto/api'

import {getAgent} from '#/state/session'
import {STALE} from '#/state/queries'
import {ThreadNode} from './post-thread'

export const RQKEY = (didOrHandle: string) => ['resolved-did', didOrHandle]

type UriUseQueryResult = UseQueryResult<{did: string; uri: string}, Error>
export function useResolveUriQuery(uri: string | undefined): UriUseQueryResult {
  const urip = new AtUri(uri || '')
  const res = useResolveDidQuery(urip.host)
  if (res.data) {
    urip.host = res.data
    return {
      ...res,
      data: {did: urip.host, uri: urip.toString()},
    } as UriUseQueryResult
  }
  return res as UriUseQueryResult
}

export function useResolveDidQuery(didOrHandle: string | undefined) {
  return useQuery<string, Error>({
    staleTime: STALE.INFINITY,
    queryKey: RQKEY(didOrHandle || ''),
    async queryFn() {
      if (!didOrHandle) {
        return ''
      }
      if (!didOrHandle.startsWith('did:')) {
        const res = await getAgent().resolveHandle({handle: didOrHandle})
        didOrHandle = res.data.did
      }
      return didOrHandle
    },
    enabled: !!didOrHandle,
  })
}

export function precacheProfile(
  queryClient: QueryClient,
  profile:
    | AppBskyActorDefs.ProfileView
    | AppBskyActorDefs.ProfileViewBasic
    | AppBskyActorDefs.ProfileViewDetailed,
) {
  queryClient.setQueryData(RQKEY(profile.handle), profile.did)
}

export function precacheFeedPosts(
  queryClient: QueryClient,
  posts: AppBskyFeedDefs.FeedViewPost[],
) {
  for (const post of posts) {
    precacheProfile(queryClient, post.post.author)
  }
}

export function precacheThreadPosts(
  queryClient: QueryClient,
  node: ThreadNode,
) {
  if (node.type === 'post') {
    precacheProfile(queryClient, node.post.author)
    if (node.parent) {
      precacheThreadPosts(queryClient, node.parent)
    }
    if (node.replies?.length) {
      for (const reply of node.replies) {
        precacheThreadPosts(queryClient, reply)
      }
    }
  }
}
