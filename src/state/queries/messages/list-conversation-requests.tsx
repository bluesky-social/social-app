import {
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {useChatClient} from '#/state/session'
import * as ChatBskyConvoDefs from '#/lexicons/chat/bsky/convo/defs'
import * as ChatBskyConvoListConvoRequests from '#/lexicons/chat/bsky/convo/listConvoRequests'
import * as ChatBskyGroupDefs from '#/lexicons/chat/bsky/group/defs'
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
  const client = useChatClient()

  return useInfiniteQuery({
    enabled,
    queryKey: RQKEY(limit),
    queryFn: async ({pageParam}) => {
      return await client.call(ChatBskyConvoListConvoRequests, {
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
  pages: Array<ChatBskyConvoListConvoRequests.$OutputBody>
}

export type ConvoRequestItem =
  ChatBskyConvoListConvoRequests.$OutputBody['requests'][number]

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
        if (
          bsky.isType(ChatBskyConvoDefs.convoView, item) &&
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
          !bsky.isType(ChatBskyConvoDefs.convoView, item) || item.id !== chatId,
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
        if (bsky.isType(ChatBskyConvoDefs.convoView, item)) {
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
          !bsky.isType(ChatBskyGroupDefs.joinRequestConvoView, item) ||
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
    InfiniteData<ChatBskyConvoListConvoRequests.$OutputBody>
  >({
    queryKey: [RQKEY_ROOT],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) continue

    for (const page of queryData.pages) {
      for (const item of page.requests) {
        if (bsky.isType(ChatBskyConvoDefs.convoView, item)) {
          for (const member of item.members) {
            if (member.did === did) {
              yield member
            }
          }
        } else if (bsky.isType(ChatBskyGroupDefs.joinRequestConvoView, item)) {
          if (item.owner.did === did) {
            yield item.owner
          }
        }
      }
    }
  }
}
