import {QueryClient, useQuery, UseQueryResult} from '@tanstack/react-query'
import {
  AtUri,
  AppBskyActorDefs,
  AppBskyFeedDefs,
  AppBskyEmbedRecord,
  AppBskyFeedPost,
} from '@atproto/api'

import {getAgent} from '#/state/session'
import {STALE} from '#/state/queries'
import {ThreadNode} from 'state/queries/post-thread'
import {RQKEY as RQKEY_POST} from './post'

export const RQKEY_DID = (didOrHandle: string) => ['resolved-did', didOrHandle]

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
    staleTime: STALE.HOURS.ONE,
    queryKey: RQKEY_DID(didOrHandle || ''),
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
  queryClient.setQueryData(RQKEY_DID(profile.handle), profile.did)
}

export function precacheQuoteEmbeds(queryClient: QueryClient, uris: string[]) {
  if (uris.length === 0) return // Don't block UI with this request
  ;(async () => {
    const res = await getAgent().getPosts({uris})
    if (!res.success || !res.data.posts?.[0]) return

    for (const post of res.data.posts) {
      queryClient.setQueryData(RQKEY_POST(post.uri), post)
    }
  })()
}

export function precacheFeedPosts(
  queryClient: QueryClient,
  posts: AppBskyFeedDefs.FeedViewPost[],
) {
  const quoteEmbedUris: string[] = []

  for (const post of posts) {
    // Precache the profile
    precacheProfile(queryClient, post.post.author)

    // Precache posts in quote embeds if any
    const embed = post.post.embed
    if (
      AppBskyEmbedRecord.isViewRecord(embed?.record) &&
      AppBskyFeedPost.isRecord(embed?.record.value) &&
      !queryClient.getQueryData(RQKEY_POST(embed.record.uri))
    ) {
      quoteEmbedUris.push(embed.record.uri)
    }
  }

  precacheQuoteEmbeds(queryClient, quoteEmbedUris)
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
