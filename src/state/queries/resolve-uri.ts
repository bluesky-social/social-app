import {
  QueryClient,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from '@tanstack/react-query'
import {
  AtUri,
  AppBskyActorDefs,
  AppBskyFeedDefs,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
} from '@atproto/api'
import {profileBasicKey as RQKEY_PROFILE_BASIC} from 'state/queries/profile'
import {RQKEY as RQKEY_POST} from './post'

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
  const queryClient = useQueryClient()

  return useQuery<string, Error>({
    staleTime: STALE.HOURS.ONE,
    queryKey: RQKEY(didOrHandle ?? ''),
    queryFn: async () => {
      if (!didOrHandle) return ''
      // Just return the did if it's already one
      if (didOrHandle.startsWith('did:')) return didOrHandle

      const res = await getAgent().resolveHandle({handle: didOrHandle})
      return res.data.did
    },
    initialData: () => {
      // Return undefined if no did or handle
      if (!didOrHandle) return

      let item: AppBskyActorDefs.ProfileViewBasic | undefined

      if (!didOrHandle?.startsWith('did:')) {
        // If this is a handle all we have to do is use the query key
        item = queryClient.getQueryData<AppBskyActorDefs.ProfileViewBasic>(
          RQKEY_PROFILE_BASIC(didOrHandle),
        )
      } else {
        // If it is a did we need to search the queries data
        item = queryClient
          .getQueriesData<AppBskyActorDefs.ProfileViewBasic>({
            queryKey: ['profileBasic'],
            exact: false,
          })
          .find(q => q[1]?.did === didOrHandle)?.[1]
      }
      // Return nothing if we don't find one
      if (!item) return undefined

      return item.did
    },
  })
}

export function precacheProfile(
  queryClient: QueryClient,
  profile: AppBskyActorDefs.ProfileViewBasic,
) {
  queryClient.setQueryData(RQKEY_PROFILE_BASIC(profile.handle), profile)
}

export function precacheQuoteEmbeds(queryClient: QueryClient, uris: string[]) {
  if (uris.length === 0) return
  ;(async () => {
    // Don't block the UI with this request
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
      precacheProfile(queryClient, embed.record.author)
    } else if (
      AppBskyEmbedRecordWithMedia.isView(embed) &&
      AppBskyEmbedRecord.isViewRecord(embed.record.record)
    ) {
      precacheProfile(queryClient, embed.record.record.author)
      quoteEmbedUris.push(embed.record.record.uri as string)
    }
  }

  for (const post of posts) {
    // Save the author of the post every time
    precacheProfile(queryClient, post.post.author)
    handleEmbed(post.post.embed)

    // Cache parent author and embeds
    if (post.reply?.parent.author) {
      precacheProfile(
        queryClient,
        post.reply.parent.author as AppBskyActorDefs.ProfileViewBasic,
      )
      handleEmbed(post.reply?.parent.embed)
    }
  }

  // Precache the quotes finally
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
