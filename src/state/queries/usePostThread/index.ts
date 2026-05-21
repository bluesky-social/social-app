import {useCallback, useMemo, useState} from 'react'
import {useQuery, useQueryClient} from '@tanstack/react-query'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useThreadPreferences} from '#/state/queries/preferences/useThreadPreferences'
import {
  LINEAR_VIEW_BELOW,
  LINEAR_VIEW_BF,
  TREE_VIEW_BELOW,
  TREE_VIEW_BELOW_DESKTOP,
  TREE_VIEW_BF,
} from '#/state/queries/usePostThread/const'
import {type PostThreadContextType} from '#/state/queries/usePostThread/context'
import {
  createCacheMutator,
  getThreadPlaceholder,
} from '#/state/queries/usePostThread/queryCache'
import {
  buildThread,
  sortAndAnnotateThreadItems,
} from '#/state/queries/usePostThread/traversal'
import {
  createPostThreadOtherQueryKey,
  createPostThreadQueryKey,
  type ThreadItem,
  type UsePostThreadQueryResult,
} from '#/state/queries/usePostThread/types'
import {getThreadgateRecord} from '#/state/queries/usePostThread/utils'
import * as views from '#/state/queries/usePostThread/views'
import {useAgent, useSession} from '#/state/session'
import {useMergeThreadgateHiddenReplies} from '#/state/threadgate-hidden-replies'
import {useBreakpoints} from '#/alf'
import {IS_WEB} from '#/env'

export * from '#/state/queries/usePostThread/context'
export {useUpdatePostThreadThreadgateQueryCache} from '#/state/queries/usePostThread/queryCache'
export * from '#/state/queries/usePostThread/types'

export function usePostThread({anchor}: {anchor?: string}) {
  const qc = useQueryClient()
  const agent = useAgent()
  const {hasSession} = useSession()
  const {gtPhone} = useBreakpoints()
  const moderationOpts = useModerationOpts()
  const mergeThreadgateHiddenReplies = useMergeThreadgateHiddenReplies()
  const {
    isLoaded: isThreadPreferencesLoaded,
    sort,
    setSort: baseSetSort,
    view,
    setView: baseSetView,
  } = useThreadPreferences()
  const below = useMemo(() => {
    return view === 'linear'
      ? LINEAR_VIEW_BELOW
      : IS_WEB && gtPhone
        ? TREE_VIEW_BELOW_DESKTOP
        : TREE_VIEW_BELOW
  }, [view, gtPhone])

  const postThreadQueryKey = createPostThreadQueryKey({
    anchor,
    sort,
    view,
  })
  const postThreadOtherQueryKey = createPostThreadOtherQueryKey({
    anchor,
  })

  const query = useQuery<UsePostThreadQueryResult>({
    enabled: isThreadPreferencesLoaded && !!anchor && !!moderationOpts,
    queryKey: postThreadQueryKey,
    async queryFn(ctx) {
      const {data} = await agent.app.bsky.unspecced.getPostThreadV2({
        anchor: anchor!,
        branchingFactor: view === 'linear' ? LINEAR_VIEW_BF : TREE_VIEW_BF,
        below,
        sort: sort,
      })

      /*
       * Initialize `ctx.meta` to track if we know we have additional replies
       * we could fetch once we hit the end.
       */
      ctx.meta = ctx.meta || {
        hasOtherReplies: false,
      }

      /*
       * If we know we have additional replies, we'll set this to true.
       */
      if (data.hasOtherReplies) {
        ctx.meta.hasOtherReplies = true
      }

      const result = {
        thread: data.thread || [],
        threadgate: data.threadgate,
        hasOtherReplies: !!ctx.meta.hasOtherReplies,
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
      return {thread, threadgate: undefined, hasOtherReplies: false}
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
  const hasOtherThreadItems = useMemo(
    () => !!query.data?.hasOtherReplies,
    [query.data?.hasOtherReplies],
  )
  const [otherItemsVisible, setOtherItemsVisible] = useState(false)

  /**
   * Creates a mutator for the post thread cache. This is used to insert
   * replies into the thread cache after posting.
   */
  const mutator = useMemo(
    () =>
      createCacheMutator({
        params: {view, below},
        postThreadQueryKey,
        postThreadOtherQueryKey,
        queryClient: qc,
      }),
    [qc, view, below, postThreadQueryKey, postThreadOtherQueryKey],
  )

  /**
   * If we have additional items available from the server and the user has
   * chosen to view them, start loading data
   */
  const additionalQueryEnabled = hasOtherThreadItems && otherItemsVisible
  const additionalItemsQuery = useQuery({
    enabled: additionalQueryEnabled,
    queryKey: postThreadOtherQueryKey,
    async queryFn() {
      const {data} = await agent.app.bsky.unspecced.getPostThreadOtherV2({
        anchor: anchor!,
      })
      return data
    },
  })
  const serverOtherThreadItems: ThreadItem[] = useMemo(() => {
    if (!additionalQueryEnabled) return []
    if (additionalItemsQuery.isLoading) {
      return Array.from({length: 2}).map((_, i) =>
        views.skeleton({
          key: `other-reply-${i}`,
          item: 'reply',
        }),
      )
    } else if (additionalItemsQuery.isError) {
      /*
       * We could insert an special error component in here, but since these
       * are optional additional replies, it's not critical that they're shown
       * atm.
       */
      return []
    } else if (additionalItemsQuery.data?.thread) {
      const {threadItems} = sortAndAnnotateThreadItems(
        additionalItemsQuery.data.thread,
        {
          view,
          skipModerationHandling: true,
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
    additionalQueryEnabled,
    additionalItemsQuery,
    mergeThreadgateHiddenReplies,
    moderationOpts,
    threadgate?.record,
  ])

  /**
   * Sets the sort order for the thread and resets the additional thread items
   */
  const setSort: typeof baseSetSort = useCallback(
    nextSort => {
      setOtherItemsVisible(false)
      baseSetSort(nextSort)
    },
    [baseSetSort, setOtherItemsVisible],
  )

  /**
   * Sets the view variant for the thread and resets the additional thread items
   */
  const setView: typeof baseSetView = useCallback(
    nextView => {
      setOtherItemsVisible(false)
      baseSetView(nextView)
    },
    [baseSetView, setOtherItemsVisible],
  )

  /*
   * This is the main thread response, sorted into separate buckets based on
   * moderation, and annotated with all UI state needed for rendering.
   */
  const {threadItems, otherThreadItems} = useMemo(() => {
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
   * along with any other thread items required for rendering e.g. "Show more
   * replies" or the reply composer.
   */
  const items = useMemo(() => {
    return buildThread({
      threadItems,
      otherThreadItems,
      serverOtherThreadItems,
      isLoading: query.isPlaceholderData,
      hasSession,
      hasOtherThreadItems,
      otherItemsVisible,
      showOtherItems: () => setOtherItemsVisible(true),
    })
  }, [
    threadItems,
    otherThreadItems,
    serverOtherThreadItems,
    query.isPlaceholderData,
    hasSession,
    hasOtherThreadItems,
    otherItemsVisible,
    setOtherItemsVisible,
  ])

  return useMemo(() => {
    const context: PostThreadContextType = {
      postThreadQueryKey,
      postThreadOtherQueryKey,
    }
    return {
      context,
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
        otherItemsVisible,
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
    }
  }, [
    query,
    mutator.insertReplies,
    otherItemsVisible,
    sort,
    view,
    setSort,
    setView,
    threadgate,
    items,
    postThreadQueryKey,
    postThreadOtherQueryKey,
  ])
}
