import {useCallback, useMemo, useState} from 'react'
import {useQuery, useQueryClient} from '@tanstack/react-query'

import {wait} from '#/lib/async/wait'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useThreadPreferences} from '#/state/queries/preferences/useThreadPreferences'
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

  const query = useQuery<UsePostThreadQueryResult>({
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
  const hasServerHiddenItems = useMemo(
    () => !!query.data?.hasHiddenReplies,
    [query.data?.hasHiddenReplies],
  )

  const [hiddenItemsVisible, setHiddenItemsVisible] = useState(false)
  const [serverHiddenThreadItems, setServerHiddenThreadItems] = useState<
    ThreadItem[]
  >([])

  /**
   * Sets the sort order for the thread and resets the hidden items
   */
  const setSort: typeof baseSetSort = useCallback(
    nextSort => {
      setHiddenItemsVisible(false)
      setServerHiddenThreadItems([])
      baseSetSort(nextSort)
    },
    [baseSetSort, setServerHiddenThreadItems, setHiddenItemsVisible],
  )

  /**
   * Sets the view variant for the thread and resets the hidden items
   */
  const setView: typeof baseSetView = useCallback(
    nextView => {
      setHiddenItemsVisible(false)
      setServerHiddenThreadItems([])
      baseSetView(nextView)
    },
    [baseSetView, setServerHiddenThreadItems, setHiddenItemsVisible],
  )

  /**
   * Creates a mutator for the post thread cache. This is used to insert
   * replies into the thread cache after posting.
   */
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

  /**
   * Loads hidden replies for this thread. Any replies that are moderated from
   * the initial visible response(s) are shown immediately. Remote data is
   * fetched and inserted when it's available.
   */
  const loadServerHiddenThreadItems = useCallback(async () => {
    /*
     * Show any moderated replies already in memory that were handled here on
     * the client. If there are server-hidden replies, we'll fetch those next.
     */
    setHiddenItemsVisible(true)

    /*
     * If there are no server hidden replies, just stop here.
     */
    if (!hasServerHiddenItems) return

    setServerHiddenThreadItems(
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

    const {threadItems} = sortAndAnnotateThreadItems(data || [], {
      view,
      skipHiddenReplyHandling: true,
      threadgateHiddenReplies: mergeThreadgateHiddenReplies(threadgate?.record),
      moderationOpts: moderationOpts!,
    })

    // insert the hidden replies into the state
    setServerHiddenThreadItems(threadItems)
  }, [
    qc,
    agent,
    view,
    anchor,
    prioritizeFollowedUsers,
    mergeThreadgateHiddenReplies,
    moderationOpts,
    threadgate?.record,
    hasServerHiddenItems,
    setHiddenItemsVisible,
  ])

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
      hasServerHiddenItems,
      hiddenItemsVisible,
      loadServerHiddenThreadItems,
    })
  }, [
    threadItems,
    hiddenThreadItems,
    serverHiddenThreadItems,
    query.isPlaceholderData,
    hasSession,
    hasServerHiddenItems,
    hiddenItemsVisible,
    loadServerHiddenThreadItems,
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
        hiddenItemsVisible,
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
      hiddenItemsVisible,
      sort,
      view,
      setSort,
      setView,
      threadgate,
      items,
    ],
  )
}
