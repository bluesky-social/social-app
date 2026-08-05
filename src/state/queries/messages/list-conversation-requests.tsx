import {
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {useChatClient} from '#/state/session'
import {chat} from '#/lexicons'
import * as bsky from '#/types/bsky'

const DEFAULT_LIMIT = 10

export const RQKEY_ROOT = 'convo-request-list'
export const RQKEY = (limit: number = DEFAULT_LIMIT) => [RQKEY_ROOT, limit]

type RQPageParam = string | undefined

export function useListConvoRequests({
  enabled = true,
  limit = DEFAULT_LIMIT,
}: {
  enabled?: boolean
  limit?: number
} = {}) {
  const chatClient = useChatClient()

  return useInfiniteQuery({
    enabled,
    queryKey: RQKEY(limit),
    queryFn: async ({pageParam}) => {
      return await chatClient.call(chat.bsky.convo.listConvoRequests, {
        limit,
        cursor: pageParam,
      })
    },
    initialPageParam: undefined as RQPageParam,
    getNextPageParam: lastPage => lastPage.cursor,
  })
}

export type ConvoRequestListQueryData = {
  pageParams: Array<string | undefined>
  pages: Array<chat.bsky.convo.listConvoRequests.$OutputBody>
}

export type ConvoRequestItem =
  chat.bsky.convo.listConvoRequests.$OutputBody['requests'][number]

export function optimisticUpdate(
  chatId: string,
  old: ConvoRequestListQueryData | undefined,
  updateFn: (
    convo: chat.bsky.convo.defs.ConvoView,
  ) => chat.bsky.convo.defs.ConvoView,
): ConvoRequestListQueryData | undefined {
  if (!old) return old

  return {
    ...old,
    pages: old.pages.map(page => ({
      ...page,
      requests: page.requests.map((item): ConvoRequestItem => {
        if (
          bsky.isType(chat.bsky.convo.defs.convoView, item) &&
          item.id === chatId
        ) {
          return {
            ...updateFn(item),
            $type: 'chat.bsky.convo.defs#convoView',
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
        item =>
          !bsky.isType(chat.bsky.convo.defs.convoView, item) ||
          item.id !== chatId,
      ),
    })),
  }
}

export function markAllRead(
  old: ConvoRequestListQueryData | undefined,
): ConvoRequestListQueryData | undefined {
  if (!old) return old

  return {
    ...old,
    pages: old.pages.map(page => ({
      ...page,
      requests: page.requests.map((item): ConvoRequestItem => {
        if (bsky.isType(chat.bsky.convo.defs.convoView, item)) {
          return {
            ...item,
            $type: 'chat.bsky.convo.defs#convoView',
            unreadCount: 0,
          }
        }
        return item
      }),
    })),
  }
}

export function optimisticDeleteJoinRequest(
  convoId: string,
  old: ConvoRequestListQueryData | undefined,
) {
  if (!old) return old

  return {
    ...old,
    pages: old.pages.map(page => ({
      ...page,
      requests: page.requests.filter(
        item =>
          !bsky.isType(chat.bsky.group.defs.joinRequestConvoView, item) ||
          item.convoId !== convoId,
      ),
    })),
  }
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
) {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<chat.bsky.convo.listConvoRequests.$OutputBody>
  >({
    queryKey: [RQKEY_ROOT],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) continue

    for (const page of queryData.pages) {
      for (const item of page.requests) {
        if (bsky.isType(chat.bsky.convo.defs.convoView, item)) {
          for (const member of item.members) {
            if (member.did === did) {
              yield member
            }
          }
        } else if (
          bsky.isType(chat.bsky.group.defs.joinRequestConvoView, item)
        ) {
          if (item.owner.did === did) {
            yield item.owner
          }
        }
      }
    }
  }
}
