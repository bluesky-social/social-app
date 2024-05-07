import {useCallback, useMemo} from 'react'
import {
  BskyAgent,
  ChatBskyConvoDefs,
  ChatBskyConvoListConvos,
} from '@atproto-labs/api'
import {useFocusEffect} from '@react-navigation/native'
import {useInfiniteQuery, useQueryClient} from '@tanstack/react-query'

import {useDmServiceUrlStorage} from '#/screens/Messages/Temp/useDmServiceUrlStorage'
import {useHeaders} from './temp-headers'

export const RQKEY = ['convo-list']
type RQPageParam = string | undefined

export function useListConvos({refetchInterval}: {refetchInterval: number}) {
  const headers = useHeaders()
  const {serviceUrl} = useDmServiceUrlStorage()

  return useInfiniteQuery({
    queryKey: RQKEY,
    queryFn: async ({pageParam}) => {
      const agent = new BskyAgent({service: serviceUrl})
      const {data} = await agent.api.chat.bsky.convo.listConvos(
        {cursor: pageParam},
        {headers},
      )

      return data
    },
    initialPageParam: undefined as RQPageParam,
    getNextPageParam: lastPage => lastPage.cursor,
    refetchInterval,
  })
}

export function useUnreadMessageCount() {
  const convos = useListConvos({
    refetchInterval: 30_000,
  })

  const count =
    convos.data?.pages
      .flatMap(page => page.convos)
      .reduce((acc, convo) => {
        return acc + (!convo.muted && convo.unreadCount > 0 ? 1 : 0)
      }, 0) ?? 0

  return useMemo(() => {
    return {
      count,
      numUnread: count > 0 ? (count > 30 ? '30+' : String(count)) : undefined,
    }
  }, [count])
}

type ConvoListQueryData = {
  pageParams: Array<string | undefined>
  pages: Array<ChatBskyConvoListConvos.OutputSchema>
}

export function useOnMarkAsRead() {
  const queryClient = useQueryClient()

  return useCallback(
    (chatId: string) => {
      queryClient.setQueryData(RQKEY, (old: ConvoListQueryData) => {
        return optimisticUpdate(chatId, old, convo => ({
          ...convo,
          unreadCount: 0,
        }))
      })
    },
    [queryClient],
  )
}

export function useMarkAsReadWhileMounted(chatId: string) {
  const markAsRead = useOnMarkAsRead()

  return useFocusEffect(
    useCallback(() => {
      markAsRead(chatId)
      return () => markAsRead(chatId)
    }, [markAsRead, chatId]),
  )
}

export function useOnDeleteMessage() {
  const queryClient = useQueryClient()

  return useCallback(
    (chatId: string, messageId: string) => {
      queryClient.setQueryData(RQKEY, (old: ConvoListQueryData) => {
        return optimisticUpdate(chatId, old, convo =>
          messageId === convo.lastMessage?.id
            ? {
                ...convo,
                lastMessage: {
                  $type: 'chat.bsky.convo.defs#deletedMessageView',
                  id: messageId,
                  rev: '',
                },
              }
            : convo,
        )
      })
    },
    [queryClient],
  )
}

export function useOnNewMessage() {
  const queryClient = useQueryClient()

  return useCallback(
    (chatId: string, message: ChatBskyConvoDefs.MessageView) => {
      queryClient.setQueryData(RQKEY, (old: ConvoListQueryData) => {
        return optimisticUpdate(chatId, old, convo => ({
          ...convo,
          lastMessage: message,
          unreadCount: convo.unreadCount + 1,
        }))
      })
      queryClient.invalidateQueries({queryKey: RQKEY})
    },
    [queryClient],
  )
}

export function useOnCreateConvo() {
  const queryClient = useQueryClient()

  return useCallback(() => {
    queryClient.invalidateQueries({queryKey: RQKEY})
  }, [queryClient])
}

function optimisticUpdate(
  chatId: string,
  old: ConvoListQueryData,
  updateFn: (convo: ChatBskyConvoDefs.ConvoView) => ChatBskyConvoDefs.ConvoView,
) {
  if (!old) {
    return old
  }

  return {
    ...old,
    pages: old.pages.map(page => ({
      ...page,
      convos: page.convos.map(convo =>
        chatId === convo.id ? updateFn(convo) : convo,
      ),
    })),
  }
}
