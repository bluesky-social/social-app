import {useMemo} from 'react'
import {useQuery, useQueryClient} from '@tanstack/react-query'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {
  createCacheMutator,
  getThreadPlaceholder,
} from '#/state/queries/usePostThread/queryCache'
import {traverse} from '#/state/queries/usePostThread/traversal'
import {
  createPostThreadQueryKey,
  HiddenReplyKind,
  type UsePostThreadProps,
} from '#/state/queries/usePostThread/types'
import {getThreadgateRecord} from '#/state/queries/usePostThread/utils'
import {useAgent, useSession} from '#/state/session'
import {useMergeThreadgateHiddenReplies} from '#/state/threadgate-hidden-replies'

export * from '#/state/queries/usePostThread/types'

export function usePostThread({
  enabled: isEnabled,
  params,
  state,
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

  // TODO map over pages, just like feeds

  const items = useMemo(() => {
    return traverse(query.data?.thread || [], {
      threadgateHiddenReplies: mergeThreadgateHiddenReplies(
        query.data?.threadgate?.record,
      ),
      moderationOpts: moderationOpts!,
      hasSession,
      showMuted: state.shownHiddenReplyKinds.has(HiddenReplyKind.Muted),
      showHidden: state.shownHiddenReplyKinds.has(HiddenReplyKind.Hidden),
      view: params.view,
    })
  }, [
    query.data,
    mergeThreadgateHiddenReplies,
    moderationOpts,
    hasSession,
    state.shownHiddenReplyKinds,
    params.view,
  ])

  const mutator = createCacheMutator({
    params,
    queryKey,
    queryClient: qc,
  })

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

  return {
    ...query,
    data: {
      items,
      threadgate: query.data?.threadgate,
    },
    insertReplies: mutator.insertReplies,
  }
}
