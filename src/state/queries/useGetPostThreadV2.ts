import {useCallback} from 'react'
import {
  $Typed,
  AtUri,
  AppBskyFeedDefs,
  AppBskyFeedThreadgate,
  AppBskyFeedGetPostThreadV2,
  ModerationOpts,
  BskyThreadViewPreference,
  moderatePost,
  ModerationDecision,
  AppBskyEmbedRecord,
  AppBskyFeedPost,
} from '@atproto/api'
import {useQuery, useQueryClient, QueryClient} from '@tanstack/react-query'

import {useAgent, useSession} from '#/state/session'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useMergeThreadgateHiddenReplies} from '#/state/threadgate-hidden-replies'
import * as bsky from '#/types/bsky'
import {
  didOrHandleUriMatches,
  embedViewRecordToPostView,
  getEmbeddedPost,
} from './util'
import {
  findAllPostsInQueryData as findAllPostsInExploreFeedPreviewsQueryData,
  findAllProfilesInQueryData as findAllProfilesInExploreFeedPreviewsQueryData,
} from '#/state/queries/explore-feed-previews'
import {findAllPostsInQueryData as findAllPostsInQuoteQueryData} from '#/state/queries/post-quotes'
import {type UsePreferencesQueryResponse} from '#/state/queries/preferences/types'
import {
  findAllPostsInQueryData as findAllPostsInSearchQueryData,
  findAllProfilesInQueryData as findAllProfilesInSearchQueryData,
} from '#/state/queries/search-posts'
import {
  findAllPostsInQueryData as findAllPostsInNotifsQueryData,
  findAllProfilesInQueryData as findAllProfilesInNotifsQueryData,
} from './notifications/feed'
import {
  findAllPostsInQueryData as findAllPostsInFeedQueryData,
  findAllProfilesInQueryData as findAllProfilesInFeedQueryData,
} from './post-feed'

export type PostThreadV2Options = {
  view: 'tree' | 'linear'
  sort: 'hotness' | 'oldest' | 'newest' | 'most-likes' | 'random' | string
  prioritizeFollows: BskyThreadViewPreference['prioritizeFollowedUsers']
}

export const getPostThreadV2QueryKeyRoot = 'getPostThreadV2' as const
export const createGetPostThreadV2QueryKey = (
  props: Pick<GetPostThreadV2Params, 'uri' | 'options'>,
) => [getPostThreadV2QueryKeyRoot, props] as const

export type GetPostThreadV2Params = {
  uri?: string
  enabled?: boolean
  options: PostThreadV2Options
}

export type GetPostThreadV2QueryData = {
  slices: Slice[]
  threadgate?: AppBskyFeedDefs.ThreadgateView
}

export function useGetPostThreadV2({
  uri,
  enabled: isEnabled,
  options,
}: GetPostThreadV2Params) {
  const qc = useQueryClient()
  const agent = useAgent()
  const {hasSession} = useSession()
  const moderationOpts = useModerationOpts()
  const mergeThreadgateHiddenReplies = useMergeThreadgateHiddenReplies()

  const enabled = isEnabled !== false && !!uri && !!moderationOpts

  const select = useCallback(
    (data: AppBskyFeedGetPostThreadV2.OutputSchema) => {
      const threadgate = getThreadgate(data.threadgate)
      return {
        slices: buildSlices(data.thread, {
          hasSession,
          options,
          threadgateHiddenReplies: mergeThreadgateHiddenReplies(threadgate),
          moderationOpts: moderationOpts!,
        }),
        threadgate: {
          ...data.threadgate,
          record: threadgate,
        },
      }
    },
    [hasSession, options, moderationOpts, mergeThreadgateHiddenReplies],
  )

  return useQuery({
    enabled,
    queryKey: createGetPostThreadV2QueryKey({
      uri,
      options,
    }),
    async queryFn() {
      const {data} = await agent.app.bsky.feed.getPostThreadV2({
        uri: uri!,
        depth: 10,
      })
      return data
    },
    placeholderData() {
      if (!uri) return
      const placeholder = getSlicePlaceholder(qc, uri)
      if (placeholder) {
        return {thread: [placeholder]}
      }
      return
    },
    select,
  })
}

export type Slice =
  | {
      type: 'threadSlice'
      key: string
      slice: Omit<AppBskyFeedDefs.ThreadItemPost, 'post'> & {
        post: Omit<AppBskyFeedDefs.PostView, 'record'> & {
          record: AppBskyFeedPost.Record
        }
      }
      moderation: ModerationDecision
      ui: {
        isAnchor: boolean
        showParentReplyLine: boolean
        showChildReplyLine: boolean
      }
    }
  | {
      type: 'threadSliceNoUnauthenticated'
      key: string
      slice: AppBskyFeedDefs.ThreadItemNoUnauthenticated
    }
  | {
      type: 'threadSliceNotFound'
      key: string
      slice: AppBskyFeedDefs.ThreadItemNotFound
    }
  | {
      type: 'threadSliceBlocked'
      key: string
      slice: AppBskyFeedDefs.ThreadItemBlocked
    }
  | {
      type: 'replyComposer'
      key: string
    }
  | {
      type: 'showHiddenReplies'
      key: string
    }
  | {
      // TODO needed?
      type: 'showMutedReplies'
      key: string
    }

export function buildSlices(
  thread: AppBskyFeedGetPostThreadV2.OutputSchema['thread'],
  {
    hasSession,
    options,
    threadgateHiddenReplies,
    moderationOpts,
  }: {
    hasSession: boolean
    options: PostThreadV2Options
    threadgateHiddenReplies: Set<string>
    moderationOpts: ModerationOpts
  },
): Slice[] {
  const slices: Slice[] = []

  for (let i = 0; i < thread.length; i++) {
    const prev = thread[i - 1]
    const slice = thread[i]
    const next = thread[i + 1]

    if (AppBskyFeedDefs.isThreadItemNoUnauthenticated(slice)) {
      slices.push({
        type: 'threadSliceNoUnauthenticated',
        key: slice.uri,
        slice,
      })
    } else if (AppBskyFeedDefs.isThreadItemNotFound(slice)) {
      slices.push({
        type: 'threadSliceNotFound',
        key: slice.uri,
        slice,
      })
    } else if (AppBskyFeedDefs.isThreadItemBlocked(slice)) {
      slices.push({
        type: 'threadSliceBlocked',
        key: slice.uri,
        slice,
      })
    } else if (AppBskyFeedDefs.isThreadItemPost(slice)) {
      slices.push({
        type: 'threadSlice',
        key: slice.uri,
        slice: {
          ...slice,
          post: {
            ...slice.post,
            record: slice.post.record as AppBskyFeedPost.Record,
          }
        },
        moderation: moderatePost(slice.post, moderationOpts),
        ui: {
          isAnchor: slice.depth === 0,
          showParentReplyLine:
            !!prev &&
            AppBskyFeedDefs.isThreadItemPost(prev) &&
            prev.depth < slice.depth,
          showChildReplyLine:
            !!next &&
            AppBskyFeedDefs.isThreadItemPost(next) &&
            next.depth > slice.depth,
        },
      })

      if (slice.depth === 0 && hasSession) {
        slices.push({
          type: 'replyComposer',
          key: 'replyComposer',
        })
      }
    }
  }

  return slices
}

function getThreadgate(
  view: AppBskyFeedGetPostThreadV2.OutputSchema['threadgate'],
) {
  return bsky.dangerousIsType<AppBskyFeedThreadgate.Record>(
    view?.record,
    AppBskyFeedThreadgate.isRecord,
  )
    ? view?.record
    : undefined
}

function getSlicePlaceholder(
  queryClient: QueryClient,
  uri: string,
): $Typed<AppBskyFeedDefs.ThreadItemPost> | void {
  let partial
  for (let item of yieldPlaceholdersFromQueryCache(queryClient, uri)) {
    /*
     * Currently, the backend doesn't send full post info in some cases (for
     * example, for quoted posts). We use missing `likeCount` as a way to
     * detect that. In the future, we should fix this on the backend, which
     * will let us always stop on the first result.
     *
     * TODO can we send in feeds and quotes?
     */
    const hasAllInfo = item.post.likeCount != null
    if (hasAllInfo) {
      return item
    } else {
      // Keep searching, we might still find a full post in the cache.
      partial = item
    }
  }
  return partial
}

export function* yieldPlaceholdersFromQueryCache(
  queryClient: QueryClient,
  uri: string,
): Generator<$Typed<AppBskyFeedDefs.ThreadItemPost>, void> {
  const atUri = new AtUri(uri)

  /*
   * Check this thread in the cache first.
   * TODO extract just this for shadowing
   */
  const queryDatas =
    queryClient.getQueriesData<AppBskyFeedGetPostThreadV2.OutputSchema>({
      queryKey: [getPostThreadV2QueryKeyRoot],
    })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData) continue

    const {thread} = queryData

    for (const item of thread) {
      if (AppBskyFeedDefs.isThreadItemPost(item)) {
        if (didOrHandleUriMatches(atUri, item.post)) {
          yield {
            ...item,
            depth: 0,
          }
        }

        const qp = getEmbeddedPost(item.post.embed)
        if (qp && didOrHandleUriMatches(atUri, qp)) {
          yield embedViewToSlicePlaceholder(qp)
        }
      }
    }
  }

  /*
   * Check notifications first. If you have a post in notifications, it's
   * often due to a like or a repost, and we want to prioritize a post object
   * with >0 likes/reposts over a stale version with no metrics in order to
   * avoid a notification->post scroll jump.
   */
  for (let post of findAllPostsInNotifsQueryData(queryClient, uri)) {
    yield postViewToSlicePlaceholder(post)
  }
  for (let post of findAllPostsInFeedQueryData(queryClient, uri)) {
    yield postViewToSlicePlaceholder(post)
  }
  for (let post of findAllPostsInQuoteQueryData(queryClient, uri)) {
    yield postViewToSlicePlaceholder(post)
  }
  for (let post of findAllPostsInSearchQueryData(queryClient, uri)) {
    yield postViewToSlicePlaceholder(post)
  }
  for (let post of findAllPostsInExploreFeedPreviewsQueryData(
    queryClient,
    uri,
  )) {
    yield postViewToSlicePlaceholder(post)
  }
}

function postViewToSlicePlaceholder(
  post: AppBskyFeedDefs.PostView,
): $Typed<AppBskyFeedDefs.ThreadItemPost> {
  return {
    $type: 'app.bsky.feed.defs#threadItemPost',
    uri: post.uri,
    post,
    depth: 0, // reset to 0 for highlighted post
    isOPThread: false, // unknown
    hasOPLike: false, // unknown
    hasUnhydratedReplies: false, // unknown
    // TODO test
    hasUnhydratedParents: !!(post.record as AppBskyFeedPost.Record).reply, // unknown
  }
}

function embedViewToSlicePlaceholder(
  record: AppBskyEmbedRecord.ViewRecord,
): $Typed<AppBskyFeedDefs.ThreadItemPost> {
  return {
    $type: 'app.bsky.feed.defs#threadItemPost',
    uri: record.uri,
    post: embedViewRecordToPostView(record),
    depth: 0, // reset to 0 for highlighted post
    isOPThread: false, // unknown
    hasOPLike: false, // unknown
    hasUnhydratedReplies: false, // unknown
    // TODO test
    hasUnhydratedParents: !!(record.value as AppBskyFeedPost.Record).reply, // unknown
  }
}
