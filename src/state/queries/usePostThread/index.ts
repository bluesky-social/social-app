import {useCallback, useMemo, useRef, useState} from 'react'
import {useQuery, useQueryClient} from '@tanstack/react-query'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {
  createCacheMutator,
  getThreadPlaceholder,
} from '#/state/queries/usePostThread/queryCache'
import {traverse} from '#/state/queries/usePostThread/traversal'
import {
  createPostThreadQueryKey,
  createPostThreadHiddenQueryKey,
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
    async queryFn() {
      const {data} = await agent.app.bsky.unspecced.getPostThreadV2({
        anchor: params.anchor!,
        branchingFactor: params.view === 'linear' ? 1 : undefined,
        below: 4,
        sort: params.sort,
        prioritizeFollowedUsers: params.prioritizeFollowedUsers,
      })
      return data
    },
    placeholderData() {
      if (!params.anchor) return

      const placeholder = getThreadPlaceholder(qc, params.anchor)

      if (placeholder) {
        return {thread: [placeholder], hasHiddenReplies: false}
      }

      /*
       * Return empty data here so that `isPlaceholderData` is always true,
       * which we'll use to insert skeletons.
       */
      return {thread: [], hasHiddenReplies: false}
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

  const hasHiddenReplies = useRef(false)
  if (query?.data?.hasHiddenReplies) {
    hasHiddenReplies.current = true
  }

  const [showHiddenReplies, setShowHiddenReplies] = useState(false)
  const [hiddenReplies, setHiddenReplies] = useState<ThreadItem[]>([])
  const loadHiddenReplies = useCallback(async () => {
    setShowHiddenReplies(true)
    setHiddenReplies(Array.from({length: 2}).map((_, i) => ({
      type: 'skeleton',
      key: `${params.anchor!}-reply-${i}`,
      item: 'reply',
    })))
    const queryParams = {
      anchor: params.anchor!,
      prioritizeFollowedUsers: params.prioritizeFollowedUsers,
    }
    const data = await qc.fetchQuery({
      queryKey: createPostThreadHiddenQueryKey(queryParams),
      async queryFn() {
        const {data} = await agent.app.bsky.unspecced.getPostThreadHiddenV2(queryParams)
        return data.thread || []
      },
    })
    const items = traverse(data || [], {
      threadgateHiddenReplies: mergeThreadgateHiddenReplies(
        query.data?.threadgate?.record,
      ),
      moderationOpts: moderationOpts!,
      hasSession,
      view: params.view,
      hasHiddenReplies: hasHiddenReplies.current,
      showHiddenReplies,
      skipHiddenReplyHandling: true,
      loadHiddenReplies,
    })
    setHiddenReplies(items)
  }, [params, setShowHiddenReplies])

  const items = useMemo(() => {
    const results = traverse(query.data?.thread || [], {
      threadgateHiddenReplies: mergeThreadgateHiddenReplies(
        query.data?.threadgate?.record,
      ),
      moderationOpts: moderationOpts!,
      hasSession,
      view: params.view,
      hasHiddenReplies: hasHiddenReplies.current,
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
      hasHiddenReplies: hasHiddenReplies.current,
      showHiddenReplies,
      insertReplies: mutator.insertReplies,
    }),
    [query, items, mutator.insertReplies, showHiddenReplies],
  )
}
