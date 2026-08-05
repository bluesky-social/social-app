import {type AtIdentifierString} from '@atproto/syntax'
import {moderateUserList} from '@bsky.app/sdk/moderation'
import {
  type InfiniteData,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {useAppviewClient} from '#/state/session'
import {app} from '#/lexicons'
import {useModerationOpts} from '../preferences/moderation-opts'

const PAGE_SIZE = 30
type RQPageParam = string | undefined

export const RQKEY_ROOT = 'profile-lists'
export const RQKEY = (did: string) => [RQKEY_ROOT, did]

export function useProfileListsQuery(did: string, opts?: {enabled?: boolean}) {
  const moderationOpts = useModerationOpts()
  const enabled = opts?.enabled !== false && Boolean(moderationOpts)
  const client = useAppviewClient()
  return useInfiniteQuery<
    app.bsky.graph.getLists.$OutputBody,
    Error,
    InfiniteData<app.bsky.graph.getLists.$OutputBody>,
    QueryKey,
    RQPageParam
  >({
    queryKey: RQKEY(did),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      return await client.call(app.bsky.graph.getLists, {
        actor: did as AtIdentifierString,
        limit: PAGE_SIZE,
        cursor: pageParam,
      })
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
              return !decision
                .ui('contentList')
                .filters.some(cause => cause.type !== 'muted')
            }),
          }
        }),
      }
    },
  })
}
