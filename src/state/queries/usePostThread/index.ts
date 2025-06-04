import {useCallback, useMemo, useState} from 'react'
import {useQuery, useQueryClient} from '@tanstack/react-query'

import {wait} from '#/lib/async/wait'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useThreadPreferences} from '#/state/queries/preferences/useThreadPreferences'
import {
  createCacheMutator,
  getThreadPlaceholder,
} from '#/state/queries/usePostThread/queryCache'
import {traverse} from '#/state/queries/usePostThread/traversal'
import {
  createPostThreadHiddenQueryKey,
  createPostThreadQueryKey,
  type ThreadItem,
} from '#/state/queries/usePostThread/types'
import {getThreadgateRecord} from '#/state/queries/usePostThread/utils'
import * as views from '#/state/queries/usePostThread/views'
import {useAgent, useSession} from '#/state/session'
import {useMergeThreadgateHiddenReplies} from '#/state/threadgate-hidden-replies'

export * from '#/state/queries/usePostThread/types'

export function usePostThread({anchor}: {anchor?: string}) {
  const qc = useQueryClient()
  const agent = useAgent()
  const {hasSession} = useSession()
  const moderationOpts = useModerationOpts()
  const mergeThreadgateHiddenReplies = useMergeThreadgateHiddenReplies()
  const {
    isLoaded: isThreadPreferencesLoaded,
    sort,
    setSort: baseSetSort,
    view,
    setView: baseSetView,
    prioritizeFollowedUsers,
  } = useThreadPreferences()
  const postThreadQueryKey = createPostThreadQueryKey({
    anchor,
    sort,
    view,
    prioritizeFollowedUsers,
  })

  const query = useQuery({
    enabled: isThreadPreferencesLoaded && !!anchor && !!moderationOpts,
    queryKey: postThreadQueryKey,
    // gcTime: 0, // TODO faster if we let it cache
    async queryFn(ctx) {
      const {data} = await wait(
        400,
        agent.app.bsky.unspecced.getPostThreadV2({
          anchor: anchor!,
          branchingFactor: view === 'linear' ? 1 : undefined,
          below: 4,
          sort: sort,
          prioritizeFollowedUsers: prioritizeFollowedUsers,
        }),
      )

      /*
       * Initialize `ctx.meta` to track if there are hidden replies in any of
       * the fetched pages of results.
       */
      ctx.meta = ctx.meta || {
        hasHiddenReplies: false,
      }

      /*
       * If we ever see hidden replies, we'll set this to true.
       */
      if (data.hasHiddenReplies) {
        ctx.meta.hasHiddenReplies = true
      }

      return {
        ...data,
        hasHiddenReplies: !!ctx.meta.hasHiddenReplies,
      }
    },
    placeholderData() {
      if (!anchor) return
      const placeholder = getThreadPlaceholder(qc, anchor)
      /*
       * Always return something here, even empty data, so that
       * `isPlaceholderData` is always true, which we'll use to insert
       * skeletons.
       */
      const thread = placeholder ? [placeholder] : []
      return {thread, threadgate: undefined, hasHiddenReplies: false}
    },
    select(data) {
      const threadgate = getThreadgateRecord(data.threadgate)
      return {
        ...data,
        threadgate: {
          ...data.threadgate,
          record: threadgate,
        },
      }
    },
  })

  const hasServerHiddenReplies = !!query.data?.hasHiddenReplies
  const [hiddenRepliesVisible, setHiddenRepliesVisible] = useState(false)
  const [additionalHiddenItems, setAdditionalHiddenItems] = useState<
    ThreadItem[]
  >([])

  /**
   * Loads hidden replies for this thread. Any replies that are moderated from
   * the initial visible response(s) are shown immediately. Remote data is
   * fetched and inserted when it's available.
   */
  const loadHiddenReplies = useCallback(async () => {
    /*
     * Show any moderated replies already in memory that were handled here on
     * the client. If there are server-hidden replies, we'll fetch those next.
     */
    setHiddenRepliesVisible(true)

    /*
     * If there are no server hidden replies, just stop here.
     */
    if (!hasServerHiddenReplies) return

    setAdditionalHiddenItems(
      Array.from({length: 2}).map((_, i) =>
        views.skeleton({
          key: `${anchor!}-reply-${i}`,
          item: 'reply',
        }),
      ),
    )

    const params = {
      anchor: anchor!,
      prioritizeFollowedUsers,
    }
    const data = await wait(
      400,
      qc.fetchQuery({
        queryKey: createPostThreadHiddenQueryKey(params),
        async queryFn() {
          const {data} = await agent.app.bsky.unspecced.getPostThreadHiddenV2(
            params,
          )
          return data.thread || []
        },
      }),
    )

    const items = traverse(data || [], {
      threadgateHiddenReplies: mergeThreadgateHiddenReplies(
        query.data?.threadgate?.record,
      ),
      moderationOpts: moderationOpts!,
      hasSession,
      view,
      hasServerHiddenReplies,
      hiddenRepliesVisible,
      skipHiddenReplyHandling: true,
      loadHiddenReplies,
    })

    // insert the hidden replies into the state
    setAdditionalHiddenItems(items)
  }, [
    agent,
    view,
    anchor,
    prioritizeFollowedUsers,
    hasSession,
    mergeThreadgateHiddenReplies,
    moderationOpts,
    qc,
    query.data?.threadgate?.record,
    hasServerHiddenReplies,
    hiddenRepliesVisible,
    setHiddenRepliesVisible,
  ])

  const items = useMemo(() => {
    const results = traverse(query.data?.thread || [], {
      threadgateHiddenReplies: mergeThreadgateHiddenReplies(
        query.data?.threadgate?.record,
      ),
      moderationOpts: moderationOpts!,
      hasSession,
      view: view,
      hasServerHiddenReplies,
      hiddenRepliesVisible,
      loadHiddenReplies,
    })

    return results.concat(additionalHiddenItems)
  }, [
    query.data,
    mergeThreadgateHiddenReplies,
    moderationOpts,
    hasSession,
    view,
    hasServerHiddenReplies,
    hiddenRepliesVisible,
    loadHiddenReplies,
    additionalHiddenItems,
  ])

  if (query.isPlaceholderData) {
    const anchorPost = items.at(0)
    const skeletonReplies =
      anchorPost && anchorPost.type === 'threadPost'
        ? anchorPost?.value.post.replyCount ?? 4
        : 4

    if (!items.length) {
      items.push(
        views.skeleton({
          key: anchor!,
          item: 'anchor',
        }),
      )

      if (hasSession) {
        items.push(
          views.skeleton({
            key: 'replyComposer',
            item: 'replyComposer',
          }),
        )
      }
    }

    for (let i = 0; i < skeletonReplies; i++) {
      items.push(
        views.skeleton({
          key: `${anchor!}-reply-${i}`,
          item: 'reply',
        }),
      )
    }
  }

  const mutator = useMemo(
    () =>
      createCacheMutator({
        params: {
          sort,
          view,
        },
        queryKey: postThreadQueryKey,
        queryClient: qc,
      }),
    [qc, sort, view, postThreadQueryKey],
  )

  const setSort: typeof baseSetSort = useCallback(
    nextSort => {
      setHiddenRepliesVisible(false)
      setAdditionalHiddenItems([])
      baseSetSort(nextSort)
    },
    [baseSetSort, setAdditionalHiddenItems, setHiddenRepliesVisible],
  )

  const setView: typeof baseSetView = useCallback(
    nextView => {
      setHiddenRepliesVisible(false)
      setAdditionalHiddenItems([])
      baseSetView(nextView)
    },
    [baseSetView, setAdditionalHiddenItems, setHiddenRepliesVisible],
  )

  return useMemo(
    () => ({
      state: {
        isFetching: query.isFetching,
        isPlaceholderData: query.isPlaceholderData,
        error: query.error,
        hiddenRepliesVisible,
        sort,
        view,
      },
      data: {
        items: items || [],
        threadgate: query.data?.threadgate,
      },
      actions: {
        insertReplies: mutator.insertReplies,
        refetch: query.refetch,
        setSort,
        setView,
      },
    }),
    [
      query,
      items,
      mutator.insertReplies,
      hiddenRepliesVisible,
      sort,
      view,
      setSort,
      setView,
    ],
  )
}
