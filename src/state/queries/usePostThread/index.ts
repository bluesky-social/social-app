import {useCallback, useMemo, useState} from 'react'
import {useQuery, useQueryClient} from '@tanstack/react-query'

import {wait} from '#/lib/async/wait'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useThreadPreferences} from '#/state/queries/preferences/useThreadPreferences'
import {BELOW} from '#/state/queries/usePostThread/const'
import {
  createCacheMutator,
  getThreadPlaceholder,
} from '#/state/queries/usePostThread/queryCache'
import {
  buildThread,
  sortAndAnnotateThreadItems,
} from '#/state/queries/usePostThread/traversal'
import {
  createPostThreadHiddenQueryKey,
  createPostThreadQueryKey,
  type ThreadItem,
  type UsePostThreadQueryResult,
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
  const postThreadHiddenQueryKey = createPostThreadHiddenQueryKey({
    anchor,
    prioritizeFollowedUsers,
  })

  const query = useQuery<UsePostThreadQueryResult>({
    enabled: isThreadPreferencesLoaded && !!anchor && !!moderationOpts,
    queryKey: postThreadQueryKey,
    async queryFn(ctx) {
      const {data} = await wait(
        400,
        agent.app.bsky.unspecced.getPostThreadV2({
          anchor: anchor!,
          branchingFactor: view === 'linear' ? 1 : undefined,
          below: BELOW,
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

      const result = {
        thread: data.thread || [],
        threadgate: data.threadgate,
        hasHiddenReplies: !!ctx.meta.hasHiddenReplies,
      }

      const record = getThreadgateRecord(result.threadgate)
      if (result.threadgate && record) {
        result.threadgate.record = record
      }

      return result as UsePostThreadQueryResult
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
      const record = getThreadgateRecord(data.threadgate)
      if (data.threadgate && record) {
        data.threadgate.record = record
      }
      return data
    },
  })

  const thread = useMemo(() => query.data?.thread || [], [query.data?.thread])
  const threadgate = useMemo(
    () => query.data?.threadgate,
    [query.data?.threadgate],
  )
  const hasServerHiddenThreadItems = useMemo(
    () => !!query.data?.hasHiddenReplies,
    [query.data?.hasHiddenReplies],
  )
  const [hiddenThreadItemsVisible, setHiddenThreadItemsVisible] =
    useState(false)

  /**
   * Creates a mutator for the post thread cache. This is used to insert
   * replies into the thread cache after posting.
   */
  const mutator = useMemo(
    () =>
      createCacheMutator({
        params: {view},
        postThreadQueryKey,
        postThreadHiddenQueryKey,
        queryClient: qc,
      }),
    [qc, view, postThreadQueryKey, postThreadHiddenQueryKey],
  )

  /**
   * If we have server-hidden items and the user has chosen to view them,
   * start loading data
   */
  const hiddenQueryEnabled =
    hasServerHiddenThreadItems && hiddenThreadItemsVisible
  const hiddenQuery = useQuery({
    enabled: hiddenQueryEnabled,
    queryKey: postThreadHiddenQueryKey,
    async queryFn() {
      const {data} = await wait(
        400,
        agent.app.bsky.unspecced.getPostThreadHiddenV2({
          anchor: anchor!,
          prioritizeFollowedUsers,
        }),
      )
      return data
    },
  })
  const serverHiddenThreadItems: ThreadItem[] = useMemo(() => {
    if (!hiddenQueryEnabled) return []
    if (hiddenQuery.isLoading) {
      return Array.from({length: 2}).map((_, i) =>
        views.skeleton({
          key: `hidden-reply-${i}`,
          item: 'reply',
        }),
      )
    } else if (hiddenQuery.isError) {
      // TODO could insert error component
      return []
    } else if (hiddenQuery.data?.thread) {
      const {threadItems} = sortAndAnnotateThreadItems(
        hiddenQuery.data.thread,
        {
          view,
          skipHiddenReplyHandling: true,
          threadgateHiddenReplies: mergeThreadgateHiddenReplies(
            threadgate?.record,
          ),
          moderationOpts: moderationOpts!,
        },
      )
      return threadItems
    } else {
      return []
    }
  }, [
    view,
    hiddenQueryEnabled,
    hiddenQuery,
    mergeThreadgateHiddenReplies,
    moderationOpts,
    threadgate?.record,
  ])

  /**
   * Sets the sort order for the thread and resets the hidden items
   */
  const setSort: typeof baseSetSort = useCallback(
    nextSort => {
      setHiddenThreadItemsVisible(false)
      baseSetSort(nextSort)
    },
    [baseSetSort, setHiddenThreadItemsVisible],
  )

  /**
   * Sets the view variant for the thread and resets the hidden items
   */
  const setView: typeof baseSetView = useCallback(
    nextView => {
      setHiddenThreadItemsVisible(false)
      baseSetView(nextView)
    },
    [baseSetView, setHiddenThreadItemsVisible],
  )

  /*
   * This is the main thread response, sorted into separate buckets based on
   * moderation, and annotated with all UI state needed for rendering.
   */
  const {threadItems, hiddenThreadItems} = useMemo(() => {
    return sortAndAnnotateThreadItems(thread, {
      view: view,
      threadgateHiddenReplies: mergeThreadgateHiddenReplies(threadgate?.record),
      moderationOpts: moderationOpts!,
    })
  }, [
    thread,
    threadgate?.record,
    mergeThreadgateHiddenReplies,
    moderationOpts,
    view,
  ])

  /*
   * Take all three sets of thread items and combine them into a single thread,
   * along with any other thread items required for rendering e.g. "Show hidden
   * replies" or the reply composer.
   */
  const items = useMemo(() => {
    return buildThread({
      threadItems,
      hiddenThreadItems,
      serverHiddenThreadItems,
      isLoading: query.isPlaceholderData,
      hasSession,
      hasServerHiddenThreadItems,
      hiddenThreadItemsVisible,
      showHiddenThreadItems: () => setHiddenThreadItemsVisible(true),
    })
  }, [
    threadItems,
    hiddenThreadItems,
    serverHiddenThreadItems,
    query.isPlaceholderData,
    hasSession,
    hasServerHiddenThreadItems,
    hiddenThreadItemsVisible,
    setHiddenThreadItemsVisible,
  ])

  return useMemo(
    () => ({
      state: {
        /*
         * Copy in any query state that is useful
         */
        isFetching: query.isFetching,
        isPlaceholderData: query.isPlaceholderData,
        error: query.error,
        /*
         * Other state
         */
        sort,
        view,
        hiddenThreadItemsVisible,
      },
      data: {
        items,
        threadgate,
      },
      actions: {
        /*
         * Copy in any query actions that are useful
         */
        insertReplies: mutator.insertReplies,
        refetch: query.refetch,
        /*
         * Other actions
         */
        setSort,
        setView,
      },
    }),
    [
      query,
      mutator.insertReplies,
      hiddenThreadItemsVisible,
      sort,
      view,
      setSort,
      setView,
      threadgate,
      items,
    ],
  )
}
