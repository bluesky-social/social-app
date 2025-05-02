import {useCallback} from 'react'
import {
  AppBskyFeedDefs,
  AppBskyFeedThreadgate,
  AppBskyFeedGetPostThreadV2,
  ModerationOpts,
  BskyThreadViewPreference,
} from '@atproto/api'
import {useQuery, useQueryClient} from '@tanstack/react-query'

import {useAgent} from '#/state/session'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useMergeThreadgateHiddenReplies} from '#/state/threadgate-hidden-replies'
import * as bsky from '#/types/bsky'

export type PostThreadV2Options = {
  view: 'tree' | 'linear'
  sort: 'hotness' | 'oldest' | 'newest' | 'most-likes' | 'random' | string
  prioritizeFollows: BskyThreadViewPreference['prioritizeFollowedUsers']
}

export function useGetPostThreadV2(
  uri?: string,
  options: PostThreadV2Options = {
    view: 'tree',
    sort: 'hotness',
    prioritizeFollows: false,
  },
) {
  const agent = useAgent()
  const moderationOpts = useModerationOpts()
  const mergeThreadgateHiddenReplies = useMergeThreadgateHiddenReplies()

  const select = useCallback(
    (data: AppBskyFeedGetPostThreadV2.OutputSchema) => {
      if (!moderationOpts) return data
      const threadgate = getThreadgate(data.threadgate)
      return {
        slices: filterThreadSlices(data.slices, {
          options,
          threadgateHiddenReplies: mergeThreadgateHiddenReplies(threadgate),
          moderationOpts,
        }),
        threadgate: {
          ...data.threadgate,
          record: threadgate,
        },
      }
    },
    [options, moderationOpts, mergeThreadgateHiddenReplies],
  )

  return useQuery({
    enabled: !!uri && !!moderationOpts,
    queryKey: ['getPostThreadV2', uri, options],
    async queryFn() {
      const {data} = await agent.app.bsky.feed.getPostThreadV2({
        uri: uri!,
        depth: 10,
      })
      return data
    },
    // TODO
    // placeholderData: () => {
    //   if (!uri) return
    //   const post = findPostInQueryData(queryClient, uri)
    //   if (post) {
    //     return {thread: post}
    //   }
    //   return undefined
    // },
    select,
  })
}

export function filterThreadSlices(
  slices: AppBskyFeedGetPostThreadV2.OutputSchema['slices'],
  {
    options,
    threadgateHiddenReplies,
    moderationOpts,
  }: {
    options: PostThreadV2Options
    threadgateHiddenReplies: Set<string>
    moderationOpts: ModerationOpts
  },
) {
  return slices
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
