import {useCallback, useMemo, useState} from 'react'
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

export type PostThreadV2Params = {
  view: 'tree' | 'linear'
  sort: 'hotness' | 'oldest' | 'newest' | 'most-likes' | 'random' | string
  prioritizeFollows: BskyThreadViewPreference['prioritizeFollowedUsers']
}

export const getPostThreadV2QueryKeyRoot = 'getPostThreadV2' as const
export const createGetPostThreadV2QueryKey = (
  props: Pick<GetPostThreadV2QueryProps, 'uri' | 'params'>,
) => [getPostThreadV2QueryKeyRoot, props] as const

export type GetPostThreadV2QueryProps = {
  uri?: string
  enabled?: boolean
  params: PostThreadV2Params
  state: {
    shownHiddenReplyKinds: Set<HiddenReplyKind>
  }
}

export type GetPostThreadV2QueryData = {
  slices: Slice[]
  threadgate?: AppBskyFeedDefs.ThreadgateView
}

export function mapSortOptionsToSortID(sort: PostThreadV2Params['sort']) {
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
  params,
  state,
}: GetPostThreadV2QueryProps) {
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
      params,
    }),
    async queryFn() {
      const {data} = await agent.app.bsky.feed.getPostThreadV2({
        uri: uri!,
        branchingFactor: params.view === 'linear' ? 1 : 10,
        below: 10,
        sorting: mapSortOptionsToSortID(params.sort),
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

  const {items, insertReplies} = useThread(query.data?.thread || [], {
    hasSession,
    params,
    threadgateHiddenReplies: mergeThreadgateHiddenReplies(
      query.data?.threadgate?.record,
    ),
    moderationOpts: moderationOpts!,
    shownHiddenReplyKinds: state.shownHiddenReplyKinds,
  })

  return {
    ...query,
    data: {
      slices: items,
      threadgate: query.data?.threadgate,
    },
    insertReplies,
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

/**
 * Get the start and end index of a "branch" of the thread. A "branch" is a
 * parent and it's children (not siblings). Returned indices are inclusive of
 * the parent and its last child.
 *
 *    items[]            (index, depth)
 *      ├── branch ───── (0, 1)
 *      ├─┬ branch ───── (1, 1) (start)
 *      │ ├──┬ leaf ──── (2, 2)
 *      │ │  └── leaf ── (3, 3)
 *      │ └── leaf ───── (4, 2) (end)
 *      ├── branch ───── (5, 1)
 *      ├── branch ───── (6, 1)
 *
 *    const { start: 1, end: 3 } = getBranch(items, 1, 1)
 */
function getBranch(
  thread: AppBskyFeedGetPostThreadV2.OutputSchema['thread'],
  branchStartIndex: number,
  branchStartDepth: number,
) {
  let end = branchStartIndex

  for (let ci = branchStartIndex + 1; ci < thread.length; ci++) {
    const next = thread[ci]
    // ignore unknowns
    if (!('depth' in next)) continue
    if (next.depth > branchStartDepth) {
      end = ci
    } else {
      end = ci - 1
      break
    }
  }

  return {
    start: branchStartIndex,
    end,
  }
}

export function useThread(
  thread: AppBskyFeedGetPostThreadV2.OutputSchema['thread'],
  {
    hasSession,
    params,
    threadgateHiddenReplies,
    moderationOpts,
    shownHiddenReplyKinds,
  }: {
    hasSession: boolean
    params: PostThreadV2Params
    threadgateHiddenReplies: Set<string>
    moderationOpts: ModerationOpts
    shownHiddenReplyKinds: Set<HiddenReplyKind>
  },
) {
  const isTreeView = params.view === 'tree'
  const [shadowSlices, setShadowSlices] = useState<
    Record<string, AppBskyFeedDefs.ThreadItemPost[][]>
  >({})
  const insertReplies = useCallback((belowUri: string, posts: AppBskyFeedDefs.ThreadItemPost[]) => {
    setShadowSlices(p => {
      const prev = {...p}
      if (belowUri in prev) {
        prev[belowUri] = [posts, ...(prev[belowUri] || {})]
      } else {
        prev[belowUri] = [posts]
      }
      return prev
    })
  }, [setShadowSlices])

  const sorted = useMemo(() => {
    return sortThread(thread, {
      threadgateHiddenReplies,
      moderationOpts,
    })
  }, [thread, threadgateHiddenReplies, moderationOpts])

  const flattened = useMemo(() => {
    const showMuted = shownHiddenReplyKinds.has(HiddenReplyKind.Muted)
    const showHidden = shownHiddenReplyKinds.has(HiddenReplyKind.Hidden)

    if (sorted.hidden.length) {
      if (showHidden) {
        sorted.slices.push(...sorted.hidden)

        if (sorted.muted.length) {
          if (showMuted) {
            sorted.slices.push(...sorted.muted)
          } else {
            sorted.slices.push({
              type: 'showHiddenReplies',
              key: 'showMutedReplies',
              kind: HiddenReplyKind.Muted,
            })
          }
        }
      } else {
        sorted.slices.push({
          type: 'showHiddenReplies',
          key: 'showHiddenReplies',
          kind: HiddenReplyKind.Hidden,
        })
      }
    } else if (sorted.muted.length) {
      if (showMuted) {
        sorted.slices.push(...sorted.muted)
      } else {
        sorted.slices.push({
          type: 'showHiddenReplies',
          key: 'showMutedReplies',
          kind: HiddenReplyKind.Muted,
        })
      }
    }
    return sorted.slices
  }, [sorted, shownHiddenReplyKinds])

  // TODO should probably done in query cache so deletes flow through the same way
  const optimistic = useMemo(() => {
    for (let i = 0; i < flattened.length; i++) {
      const item = flattened[i]
      if (item.type !== 'threadSlice') continue
      if (!(item.slice.uri in shadowSlices)) continue

      const replyThreads = shadowSlices[item.slice.uri]

      // TODO linear view will work
      if (!isTreeView) continue

      for (const thread of replyThreads!) {
        for (let ri = 0; ri < thread.length; ri++) {
          const post = thread[ri]
          post.depth = item.slice.depth + 1 + ri
          const view = views.post({
            item: post,
            oneUp: undefined,
            oneDown: undefined,
            moderationOpts,
          })
          const insertIndex = i + 1 + ri
          flattened.splice(
            insertIndex,
            // if same post, replace in situ
            flattened[insertIndex]?.key === view.key ? 1 : 0,
            view
          )
          // console.log('insert', {
          //   post: post.post.record?.text,
          //   depth: item.slice.depth + 1 + ri,
          //   ri,
          //   spliceIndex: i + 1 + ri,
          // })
          // console.log(flattened.map(f => f.slice?.post?.record?.text))
        }

        // TODO may not need since inserts will be looped and ignored
        i = i + thread.length
      }
    }

    return [...flattened]
  }, [flattened, shadowSlices, isTreeView])

  const items = useMemo(() => {
    if (hasSession) {
      for (let i = 0; i < optimistic.length; i++) {
        const slice = optimistic[i]
        if ('slice' in slice && slice.slice.depth === 0) {
          optimistic.splice(i + 1, 0, {
            type: 'replyComposer',
            key: 'replyComposer',
          })
          break
        }
      }
    }

    return optimistic
  }, [optimistic, hasSession])

  return useMemo(
    () => ({
      items,
      insertReplies,
    }),
    [items, insertReplies],
  )
}

export function sortThread(
  thread: AppBskyFeedGetPostThreadV2.OutputSchema['thread'],
  {
    threadgateHiddenReplies,
    moderationOpts,
  }: {
    threadgateHiddenReplies: Set<string>
    moderationOpts: ModerationOpts
  },
) {
  const slices: Slice[] = []
  const hidden: Slice[] = []
  const muted: Slice[] = []

  traversal: for (let i = 0; i < thread.length; i++) {
    const item = thread[i]

    // ignore unknowns
    if (!('depth' in item)) continue

    if (item.depth < 0) {
      /*
       * Parents are ignored until we find the highlighted post, then we walk
       * _up_ from there.
       */
    } else if (item.depth === 0) {
      if (AppBskyFeedDefs.isThreadItemNoUnauthenticated(item)) {
        slices.push(views.noUnauthenticated({item}))
      } else if (AppBskyFeedDefs.isThreadItemNotFound(item)) {
        slices.push(views.notFound({item}))
      } else if (AppBskyFeedDefs.isThreadItemBlocked(item)) {
        slices.push(views.blocked({item}))
      } else if (AppBskyFeedDefs.isThreadItemPost(item)) {
        slices.push(
          views.post({
            item,
            oneUp: thread[i - 1],
            oneDown: thread[i + 1],
            moderationOpts,
          }),
        )

        parentTraversal: for (let pi = i - 1; pi >= 0; pi--) {
          const parentOneDown = thread[pi + 1]
          const parent = thread[pi]
          const parentOneUp = thread[pi - 1]

          if (AppBskyFeedDefs.isThreadItemNoUnauthenticated(parent)) {
            slices.unshift(views.noUnauthenticated({item: parent}))
            break parentTraversal
          } else if (AppBskyFeedDefs.isThreadItemNotFound(parent)) {
            slices.unshift(views.notFound({item: parent}))
            break parentTraversal
          } else if (AppBskyFeedDefs.isThreadItemBlocked(parent)) {
            slices.unshift(views.blocked({item: parent}))
            break parentTraversal
          } else if (AppBskyFeedDefs.isThreadItemPost(parent)) {
            slices.unshift(
              views.post({
                item: parent,
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
        const branch = getBranch(thread, i, item.depth)
        // could insert tombstone
        i = branch.end
        continue traversal
      } else if (AppBskyFeedDefs.isThreadItemPost(item)) {
        const lastSlice = slices[slices.length - 1]
        const isFirstReply =
          lastSlice.type === 'replyComposer' ||
          (lastSlice.type === 'threadSlice' && lastSlice.slice.depth === 0)
        const parent = views.post({
          item,
          oneUp: isFirstReply ? undefined : thread[i - 1],
          oneDown: thread[i + 1],
          moderationOpts,
        })
        const parentMod = getModerationState(parent.moderation)
        const parentIsHidden = threadgateHiddenReplies.has(item.uri)
        const parentIsTopLevelReply = item.depth === 1
        const parentIsModerated =
          parentIsHidden || parentMod.blurred || parentMod.muted

        if (!parentIsModerated) {
          /*
           * Not hidden, so show it
           */
          slices.push(parent)
        } else {
          const branch = getBranch(thread, i, item.depth)
          const sortArray = parentMod.muted ? muted : hidden

          if (parentIsTopLevelReply) {
            // push branch anchor into sorted array
            sortArray.push(parent)
            // skip branch anchor in branch traversal
            const startIndex = branch.start + 1

            for (let ci = startIndex; ci <= branch.end; ci++) {
              const child = thread[ci]

              if (AppBskyFeedDefs.isThreadItemPost(child)) {
                const childPost = views.post({
                  item: child,
                  oneUp: thread[ci - 1],
                  oneDown: thread[ci + 1],
                  moderationOpts,
                })
                const childMod = getModerationState(childPost.moderation)
                const childIsHidden = threadgateHiddenReplies.has(child.uri)

                /*
                 * If a child is hidden in any way, drop it an its sub-branch
                 * entirely. To reveal these, the user must navigate to the
                 * parent post directly.
                 */
                if (childMod.blurred || childMod.muted || childIsHidden) {
                  ci = getBranch(thread, ci, child.depth).end
                } else {
                  sortArray.push(childPost)
                }
              } else {
                /*
                 * Drop the rest of the branch if we hit anything unexpected
                 */
                break
              }
            }
          }

          /*
           * Skip to next branch
           */
          i = branch.end
          continue traversal
        }
      }
    }
  }

  return {
    slices,
    hidden,
    muted,
  }
}

export function getModerationState(moderation: ModerationDecision) {
  const modui = moderation.ui('contentList')
  const blurred = modui.blur || modui.filter
  const muted = (modui.blurs[0] || modui.filters[0])?.type === 'muted'
  return {
    blurred,
    muted,
  }
}

export enum HiddenReplyKind {
  Hidden = 'hidden',
  Muted = 'muted',
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
      kind: HiddenReplyKind
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
