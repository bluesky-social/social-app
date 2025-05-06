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
  APP_BSKY_FEED,
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

export function mapSortOptionsToSortID(sort: PostThreadV2Options['sort']) {
  switch (sort) {
    case 'hotness':
      return APP_BSKY_FEED.GetPostThreadV2Hotness
    case 'oldest':
      return APP_BSKY_FEED.GetPostThreadV2Oldest
    case 'newest':
      return APP_BSKY_FEED.GetPostThreadV2Newest
    case 'most-likes':
      return APP_BSKY_FEED.GetPostThreadV2MostLikes
    default:
      return APP_BSKY_FEED.GetPostThreadV2Hotness
  }
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

  const query = useQuery({
    enabled,
    queryKey: createGetPostThreadV2QueryKey({
      uri,
      options,
    }),
    async queryFn() {
      const {data} = await agent.app.bsky.feed.getPostThreadV2({
        uri: uri!,
        below: 10,
        sorting: mapSortOptionsToSortID(options.sort),
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
    select(data) {
      const threadgate = getThreadgate(data.threadgate)
      return {
        ...data,
        threadgate: {
          ...data.threadgate,
          record: threadgate,
        },
      }
    },
  })

  // TODO map over pages, just like feeds
  //
  // - sort up just-posted
  // - sort down hidden
  // - sort down muted
  // - sort down blurred?

  const filtered = filterAndSort(query.data?.thread || [], {
    hasSession,
    options,
    threadgateHiddenReplies: mergeThreadgateHiddenReplies(
      query.data?.threadgate?.record,
    ),
    moderationOpts: moderationOpts!,
    showHiddenReplies: false,
  })

  return {
    ...query,
    data: {
      slices: filtered,
      threadgate: query.data?.threadgate,
    },
  }
}

const views = {
  noUnauthenticated({
    item,
  }: {
    item: AppBskyFeedDefs.ThreadItemNoUnauthenticated
  }): Extract<Slice, {type: 'threadSliceNoUnauthenticated'}> {
    return {
      type: 'threadSliceNoUnauthenticated',
      key: item.uri,
      slice: item,
    }
  },
  notFound({
    item,
  }: {
    item: AppBskyFeedDefs.ThreadItemNotFound
  }): Extract<Slice, {type: 'threadSliceNotFound'}> {
    return {
      type: 'threadSliceNotFound',
      key: item.uri,
      slice: item,
    }
  },
  blocked({
    item,
  }: {
    item: AppBskyFeedDefs.ThreadItemBlocked
  }): Extract<Slice, {type: 'threadSliceBlocked'}> {
    return {
      type: 'threadSliceBlocked',
      key: item.uri,
      slice: item,
    }
  },
  post({
    item,
    oneUp,
    oneDown,
    moderationOpts,
  }: {
    item: AppBskyFeedDefs.ThreadItemPost
    oneUp?: AppBskyFeedGetPostThreadV2.OutputSchema['thread'][number]
    oneDown?: AppBskyFeedGetPostThreadV2.OutputSchema['thread'][number]
    moderationOpts: ModerationOpts
  }): Extract<Slice, {type: 'threadSlice'}> {
    return {
      type: 'threadSlice',
      key: item.uri,
      slice: {
        ...item,
        post: {
          ...item.post,
          record: item.post.record as AppBskyFeedPost.Record,
        },
      },
      moderation: moderatePost(item.post, moderationOpts),
      ui: {
        isAnchor: item.depth === 0,
        showParentReplyLine:
          !!oneUp && 'depth' in oneUp && oneUp.depth < item.depth,
        showChildReplyLine:
          !!oneDown && 'depth' in oneDown && oneDown.depth > item.depth,
      },
    }
  },
}

function getSubBranch(
  thread: AppBskyFeedGetPostThreadV2.OutputSchema['thread'],
  currentIndex: number,
  depth: number,
) {
  let nextIndex = currentIndex

  for (let ci = currentIndex + 1; ci < thread.length; ci++) {
    const next = thread[ci]
    // ignore unknowns
    if (!('depth' in next)) continue
    if (next.depth > depth) {
      nextIndex = ci
    } else {
      nextIndex = ci - 1
      break
    }
  }

  return {
    start: currentIndex,
    end: nextIndex,
    nextIndex,
    subTreeLength: nextIndex - currentIndex,
  }
}

export function filterAndSort(
  thread: AppBskyFeedGetPostThreadV2.OutputSchema['thread'],
  {
    hasSession,
    options,
    threadgateHiddenReplies,
    moderationOpts,
    showHiddenReplies = false,
  }: {
    hasSession: boolean
    options: PostThreadV2Options
    threadgateHiddenReplies: Set<string>
    moderationOpts: ModerationOpts
    showHiddenReplies: boolean
  },
) {
  const sorted: Slice[] = []
  const hidden: Slice[] = []

  traversal: for (let i = 0; i < thread.length; i++) {
    const item = thread[i]

    // ignore unknowns
    if (!('depth' in item)) continue

    const oneUp = thread[i - 1]
    const oneDown = thread[i + 1]

    if (item.depth < 0) {
      /*
       * Parents are ignored until we find the highlighted post, then we walk
       * _up_ from there.
       */
    } else if (item.depth === 0) {
      if (AppBskyFeedDefs.isThreadItemNoUnauthenticated(item)) {
        sorted.push(views.noUnauthenticated({item}))
      } else if (AppBskyFeedDefs.isThreadItemNotFound(item)) {
        sorted.push(views.notFound({item}))
      } else if (AppBskyFeedDefs.isThreadItemBlocked(item)) {
        sorted.push(views.blocked({item}))
      } else if (AppBskyFeedDefs.isThreadItemPost(item)) {
        sorted.push(
          views.post({
            item,
            oneUp: oneUp,
            oneDown: oneDown,
            moderationOpts,
          }),
        )

        if (hasSession) {
          sorted.push({
            type: 'replyComposer',
            key: 'replyComposer',
          })
        }

        parentTraversal: for (let pi = i - 1; pi >= i * -1; pi--) {
          const parentOneDown = thread[pi + 1]
          const parent = thread[pi]
          const parentOneUp = thread[pi - 1]

          if (AppBskyFeedDefs.isThreadItemNoUnauthenticated(parent)) {
            sorted.unshift(views.noUnauthenticated({item: parent}))
            break parentTraversal
          } else if (AppBskyFeedDefs.isThreadItemNotFound(parent)) {
            sorted.unshift(views.notFound({item: parent}))
            break parentTraversal
          } else if (AppBskyFeedDefs.isThreadItemBlocked(parent)) {
            sorted.unshift(views.blocked({item: parent}))
            break parentTraversal
          } else if (AppBskyFeedDefs.isThreadItemPost(parent)) {
            sorted.unshift(
              views.post({
                item,
                oneUp: parentOneUp,
                oneDown: parentOneDown,
                moderationOpts,
              }),
            )
          }
        }
      }
    } else if (item.depth > 0) {
      /*
       * The API does not send down any unavailable replies, so this will
       * always be false (for now). If we ever wanted to tombstone them here,
       * we could.
       */
      const shouldBreak =
        AppBskyFeedDefs.isThreadItemNoUnauthenticated(item) ||
        AppBskyFeedDefs.isThreadItemNotFound(item) ||
        AppBskyFeedDefs.isThreadItemBlocked(item)

      if (shouldBreak) {
        const branch = getSubBranch(thread, i, item.depth)
        // could insert tombstone
        i = branch.end
        continue traversal
      } else if (AppBskyFeedDefs.isThreadItemPost(item)) {
        const isHidden = threadgateHiddenReplies.has(item.uri)

        if (isHidden) {
          const branch = getSubBranch(thread, i, item.depth)

          /*
           * Top-level replies we re-sort to bottom
           */
          if (item.depth === 1) {
            for (let ci = branch.start; ci <= branch.end; ci++) {
              const next = thread[ci]

              if (AppBskyFeedDefs.isThreadItemPost(next)) {
                hidden.push(
                  views.post({
                    item: next,
                    oneUp: oneUp,
                    oneDown: oneDown,
                    moderationOpts,
                  }),
                )
              } else {
                break
              }
            }
          } else if (showHiddenReplies) {
            /*
             * Nested hidden replies either filter entirely or show in situ
             */
            sorted.push(
              views.post({
                item,
                oneUp,
                oneDown,
                moderationOpts,
              }),
            )
          }

          /*
           * Skip to next branch
           */
          i = branch.end
          continue traversal
        } else {
          /*
           * Not hidden, so show it
           */
          sorted.push(
            views.post({
              item,
              oneUp,
              oneDown,
              moderationOpts,
            }),
          )
        }
      }
    }
  }

  if (showHiddenReplies) {
    return sorted.concat(hidden)
  }

  return sorted
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
