import {QueryClient, useQuery, UseQueryResult} from '@tanstack/react-query'
import {
  AtUri,
  AppBskyActorDefs,
  AppBskyFeedDefs,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
} from '@atproto/api'

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
    staleTime: STALE.HOURS.ONE,
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
  // This is what we have presently. Regardless of implementation this needs to be reworked, because it doesn't
  // save enough info
  // for (const post of posts) {
  //   precacheProfile(queryClient, post.post.author)
  // }

  // One thing we know we are going to need to query is a few of the posts. This will only happen whenever there's
  // a quote embed that contains media (we need the URIs for the images). For simplicity, we'll always use this function
  // to store the author of quotes.
  // We should be able to store the author, which is ProfileViewBasic, and use that when pushing to the ProfileScreen.
  // ProfileScreen can query for the full ProfileView on push (or before, like on hover on web, on push on native)
  const quoteEmbedUris: string[] = []

  // TODO figure out the type for this
  function handleEmbed(embed?: any) {
    // If it's a view record, all we need to do is "cache" the author
    if (AppBskyEmbedRecord.isViewRecord(embed?.record)) {
      // precache(embedAuthor)
    } else if (
      AppBskyEmbedRecordWithMedia.isView(embed) &&
      AppBskyEmbedRecord.isViewRecord(embed.record.record)
    ) {
      // precache(embedAuthor)
      // quoteEmbedUris.push(uri)
    }
  }

  for (const post of posts) {
    // Save the author of the post every time
    // precache(postAuthor)
    // handleEmbed(postEmbed)

    if (post.reply?.parent?.author) {
      // precache(postReplyAuthor)
      // handleEmbed(postReplyEmbed)
    }
  }

  // precacheQuoteEmbeds(quoteEmbedUris)
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
