import {AppBskyGraphGetLists, moderateUserList} from '@atproto/api'
import {InfiniteData, QueryKey, useInfiniteQuery} from '@tanstack/react-query'

import {useAgent} from '#/state/session'
import {useModerationOpts} from '../preferences/moderation-opts'

const PAGE_SIZE = 30
type RQPageParam = string | undefined

export const RQKEY_ROOT = 'profile-lists'
export const RQKEY = (did: string) => [RQKEY_ROOT, did]

export function useProfileListsQuery(did: string, opts?: {enabled?: boolean}) {
  const moderationOpts = useModerationOpts()
  const enabled = opts?.enabled !== false && Boolean(moderationOpts)
  const agent = useAgent()
  return useInfiniteQuery<
    AppBskyGraphGetLists.OutputSchema,
    Error,
    InfiniteData<AppBskyGraphGetLists.OutputSchema>,
    QueryKey,
    RQPageParam
  >({
    queryKey: RQKEY(did),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      const res = await agent.app.bsky.graph.getLists({
        actor: did,
        limit: PAGE_SIZE,
        cursor: pageParam,
      })

      return res.data
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
    enabled,
    select(data) {
      return {
        ...data,
        pages: data.pages.map(page => {
          return {
            ...page,
            lists: page.lists.filter(list => {
              const decision = moderateUserList(list, moderationOpts!)
              return !decision.ui('contentList').filter
            }),
          }
        }),
      }
    },
  })
}
