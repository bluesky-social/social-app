import {useCallback, useMemo, useState} from 'react'
import {useQuery, useQueryClient} from '@tanstack/react-query'

import {wait} from '#/lib/async/wait'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {
  createCacheMutator,
  getThreadPlaceholder,
} from '#/state/queries/usePostThread/queryCache'
import {traverse} from '#/state/queries/usePostThread/traversal'
import {
  createPostThreadHiddenQueryKey,
  createPostThreadQueryKey,
  type ThreadItem,
  type UsePostThreadProps,
} from '#/state/queries/usePostThread/types'
import {getThreadgateRecord} from '#/state/queries/usePostThread/utils'
import {useAgent, useSession} from '#/state/session'
import {useMergeThreadgateHiddenReplies} from '#/state/threadgate-hidden-replies'

export * from '#/state/queries/usePostThread/types'

export function usePostThread({
  enabled: isEnabled,
  params,
}: UsePostThreadProps) {
  const qc = useQueryClient()
  const agent = useAgent()
  const {hasSession} = useSession()
  const moderationOpts = useModerationOpts()
  const mergeThreadgateHiddenReplies = useMergeThreadgateHiddenReplies()

  const enabled = isEnabled !== false && !!params.anchor && !!moderationOpts
  const queryKey = createPostThreadQueryKey({
    params,
  })

  const query = useQuery({
    enabled,
    queryKey,
    gcTime: 0,
    async queryFn(ctx) {
      const {data} = await wait(
        400,
        agent.app.bsky.unspecced.getPostThreadV2({
          anchor: params.anchor!,
          branchingFactor: params.view === 'linear' ? 1 : undefined,
          below: 4,
          sort: params.sort,
          prioritizeFollowedUsers: params.prioritizeFollowedUsers,
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
      if (!params.anchor) return
      const placeholder = getThreadPlaceholder(qc, params.anchor)
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

  const hasHiddenReplies = !!query.data?.hasHiddenReplies
  const [showHiddenReplies, setShowHiddenReplies] = useState(false)
  const [hiddenReplies, setHiddenReplies] = useState<ThreadItem[]>([])

  /**
   * Loads hidden replies for this thread. Any replies that are moderated from
   * the initial visible response(s) are shown immediately. Remote data is
   * fetched and inserted when it's available.
   */
  const loadHiddenReplies = useCallback(async () => {
    // immediately show any moderated replies already in memory
    setShowHiddenReplies(true)
    // add skeletons for the replies that will be loaded
    setHiddenReplies(
      Array.from({length: 2}).map((_, i) => ({
        type: 'skeleton',
        key: `${params.anchor!}-reply-${i}`,
        item: 'reply',
      })),
    )

    const queryParams = {
      anchor: params.anchor!,
      prioritizeFollowedUsers: params.prioritizeFollowedUsers,
    }

    const data = await wait(
      400,
      qc.fetchQuery({
        queryKey: createPostThreadHiddenQueryKey(queryParams),
        async queryFn() {
          const {data} = await agent.app.bsky.unspecced.getPostThreadHiddenV2(
            queryParams,
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
      view: params.view,
      hasHiddenReplies,
      showHiddenReplies,
      skipHiddenReplyHandling: true,
      loadHiddenReplies,
    })

    // insert the hidden replies into the state
    setHiddenReplies(items)
  }, [
    agent,
    params,
    hasSession,
    mergeThreadgateHiddenReplies,
    moderationOpts,
    qc,
    query.data?.threadgate?.record,
    hasHiddenReplies,
    showHiddenReplies,
    setShowHiddenReplies,
  ])

  const items = useMemo(() => {
    const results = traverse(query.data?.thread || [], {
      threadgateHiddenReplies: mergeThreadgateHiddenReplies(
        query.data?.threadgate?.record,
      ),
      moderationOpts: moderationOpts!,
      hasSession,
      view: params.view,
      hasHiddenReplies,
      showHiddenReplies,
      loadHiddenReplies,
    })

    return results.concat(hiddenReplies)
  }, [
    query.data,
    mergeThreadgateHiddenReplies,
    moderationOpts,
    hasSession,
    params.view,
    hasHiddenReplies,
    showHiddenReplies,
    loadHiddenReplies,
    hiddenReplies,
  ])

  if (query.isPlaceholderData) {
    const anchor = items.at(0)
    const skeletonReplies =
      anchor && anchor.type === 'threadPost'
        ? anchor?.value.post.replyCount ?? 4
        : 4

    if (!items.length) {
      items.push({
        type: 'skeleton',
        key: params.anchor!,
        item: 'anchor',
      })

      if (hasSession) {
        items.push({
          type: 'skeleton',
          key: 'replyComposer',
          item: 'replyComposer',
        })
      }
    }

    for (let i = 0; i < skeletonReplies; i++) {
      items.push({
        type: 'skeleton',
        key: `${params.anchor!}-reply-${i}`,
        item: 'reply',
      })
    }
  }

  const mutator = useMemo(
    () =>
      createCacheMutator({
        params,
        queryKey,
        queryClient: qc,
      }),
    [qc, params, queryKey],
  )

  return useMemo(
    () => ({
      ...query,
      data: {
        items,
        threadgate: query.data?.threadgate,
      },
      showHiddenReplies,
      insertReplies: mutator.insertReplies,
    }),
    [query, items, mutator.insertReplies, showHiddenReplies],
  )
}
