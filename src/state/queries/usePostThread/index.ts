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

  const hasHiddenReplies = useRef(false)
  const [showHiddenReplies, setShowHiddenReplies] = useState(false)

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

  if (query?.data?.hasHiddenReplies) {
    hasHiddenReplies.current = true
  }

  const loadHiddenReplies = useCallback(async () => {
    setShowHiddenReplies(true)
  }, [setShowHiddenReplies])

  const items = useMemo(() => {
    return traverse(query.data?.thread || [], {
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
  }, [
    query.data,
    mergeThreadgateHiddenReplies,
    moderationOpts,
    hasSession,
    params.view,
    showHiddenReplies,
    loadHiddenReplies,
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
