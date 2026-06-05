import {
  ChatBskyConvoDefs,
  type ChatBskyConvoListConvoRequests,
} from '@atproto/api'
import {
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {DM_SERVICE_HEADERS} from '#/lib/constants'
import {useAgent} from '#/state/session'

const DEFAULT_LIMIT = 10

export const RQKEY_ROOT = 'convo-request-list'
export const RQKEY = (limit: number = DEFAULT_LIMIT) => [RQKEY_ROOT, limit]

type RQPageParam = string | undefined

export function useListConvoRequests({
  enabled,
  limit = DEFAULT_LIMIT,
}: {
  enabled?: boolean
  limit?: number
} = {}) {
  const agent = useAgent()

  return useInfiniteQuery({
    enabled,
    queryKey: RQKEY(limit),
    queryFn: async ({pageParam}) => {
      const {data} = await agent.chat.bsky.convo.listConvoRequests(
        {limit, cursor: pageParam},
        {headers: DM_SERVICE_HEADERS},
      )
      return data
    },
    initialPageParam: undefined as RQPageParam,
    getNextPageParam: lastPage => lastPage.cursor,
  })
}

export type ConvoRequestListQueryData = {
  pageParams: Array<string | undefined>
  pages: Array<ChatBskyConvoListConvoRequests.OutputSchema>
}

export type ConvoRequestItem =
  ChatBskyConvoListConvoRequests.OutputSchema['requests'][number]

export function optimisticUpdate(
  chatId: string,
  old: ConvoRequestListQueryData | undefined,
  updateFn: (convo: ChatBskyConvoDefs.ConvoView) => ChatBskyConvoDefs.ConvoView,
): ConvoRequestListQueryData | undefined {
  if (!old) return old

  return {
    ...old,
    pages: old.pages.map(page => ({
      ...page,
      requests: page.requests.map((item): ConvoRequestItem => {
        if (ChatBskyConvoDefs.isConvoView(item) && item.id === chatId) {
          return {
            $type: 'chat.bsky.convo.defs#convoView',
            ...updateFn(item),
          }
        }
        return item
      }),
    })),
  }
}

export function optimisticDelete(
  chatId: string,
  old: ConvoRequestListQueryData | undefined,
) {
  if (!old) return old

  return {
    ...old,
    pages: old.pages.map(page => ({
      ...page,
      requests: page.requests.filter(
        item => !ChatBskyConvoDefs.isConvoView(item) || item.id !== chatId,
      ),
    })),
  }
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
) {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<ChatBskyConvoListConvoRequests.OutputSchema>
  >({
    queryKey: [RQKEY_ROOT],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) continue

    for (const page of queryData.pages) {
      for (const item of page.requests) {
        if (!ChatBskyConvoDefs.isConvoView(item)) continue
        for (const member of item.members) {
          if (member.did === did) {
            yield member
          }
        }
      }
    }
  }
}
