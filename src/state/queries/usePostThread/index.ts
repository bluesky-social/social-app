import {useQuery, useQueryClient} from '@tanstack/react-query'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {getThreadPlaceholder} from '#/state/queries/usePostThread/queryCache'
import {flatten,sort} from '#/state/queries/usePostThread/traversal'
import {
  createPostThreadQueryKey,
  HiddenReplyKind,
  type UsePostThreadProps,
} from '#/state/queries/usePostThread/types'
import {
  getThreadgateRecord,
  mapSortOptionsToSortID,
} from '#/state/queries/usePostThread/utils'
import {useAgent, useSession} from '#/state/session'
import {useMergeThreadgateHiddenReplies} from '#/state/threadgate-hidden-replies'

export * from '#/state/queries/usePostThread/types'

export function usePostThread({
  uri,
  enabled: isEnabled,
  params,
  state,
}: UsePostThreadProps) {
  const qc = useQueryClient()
  const agent = useAgent()
  const {hasSession} = useSession()
  const moderationOpts = useModerationOpts()
  const mergeThreadgateHiddenReplies = useMergeThreadgateHiddenReplies()

  const enabled = isEnabled !== false && !!uri && !!moderationOpts

  const query = useQuery({
    enabled,
    queryKey: createPostThreadQueryKey({
      uri,
      params,
    }),
    async queryFn() {
      const {data} = await agent.app.bsky.unspecced.getPostThreadV2({
        uri: uri!,
        branchingFactor: params.view === 'linear' ? 1 : 10,
        below: 10,
        sorting: mapSortOptionsToSortID(params.sort),
      })
      return data
    },
    placeholderData() {
      if (!uri) return
      const placeholder = getThreadPlaceholder(qc, uri)
      if (placeholder) {
        return {thread: [placeholder]}
      }
      return
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

  const items = flatten(
    sort(query.data?.thread || [], {
      threadgateHiddenReplies: mergeThreadgateHiddenReplies(
        query.data?.threadgate?.record,
      ),
      moderationOpts: moderationOpts!,
    }),
    {
      hasSession,
      showMuted: state.shownHiddenReplyKinds.has(HiddenReplyKind.Muted),
      showHidden: state.shownHiddenReplyKinds.has(HiddenReplyKind.Hidden),
    },
  )

  return {
    ...query,
    data: {
      slices: items,
      threadgate: query.data?.threadgate,
    },
    insertReplies: () => {},
  }
}
