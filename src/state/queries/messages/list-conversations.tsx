import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react'
import {
  ChatBskyConvoDefs,
  ChatBskyConvoListConvos,
  moderateProfile,
} from '@atproto/api'
import {
  InfiniteData,
  QueryClient,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query'
import throttle from 'lodash.throttle'

import {useCurrentConvoId} from '#/state/messages/current-convo-id'
import {useMessagesEventBus} from '#/state/messages/events'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {DM_SERVICE_HEADERS} from '#/state/queries/messages/const'
import {useAgent, useSession} from '#/state/session'

export const RQKEY = ['convo-list']
type RQPageParam = string | undefined

export function useListConvosQuery({
  enabled,
}: {
  enabled?: boolean
} = {}) {
  const agent = useAgent()

  return useInfiniteQuery({
    enabled,
    queryKey: RQKEY,
    queryFn: async ({pageParam}) => {
      const {data} = await agent.api.chat.bsky.convo.listConvos(
        {cursor: pageParam, limit: 20},
        {headers: DM_SERVICE_HEADERS},
      )

      return data
    },
    initialPageParam: undefined as RQPageParam,
    getNextPageParam: lastPage => lastPage.cursor,
  })
}

const ListConvosContext = createContext<ChatBskyConvoDefs.ConvoView[] | null>(
  null,
)

export function useListConvos() {
  const ctx = useContext(ListConvosContext)
  if (!ctx) {
    throw new Error('useListConvos must be used within a ListConvosProvider')
  }
  return ctx
}

export function ListConvosProvider({children}: {children: React.ReactNode}) {
  const {hasSession} = useSession()

  if (!hasSession) {
    return (
      <ListConvosContext.Provider value={[]}>
        {children}
      </ListConvosContext.Provider>
    )
  }

  return <ListConvosProviderInner>{children}</ListConvosProviderInner>
}

export function ListConvosProviderInner({
  children,
}: {
  children: React.ReactNode
}) {
  const {refetch, data} = useListConvosQuery()
  const messagesBus = useMessagesEventBus()
  const queryClient = useQueryClient()
  const {currentConvoId} = useCurrentConvoId()
  const {currentAccount} = useSession()

  const debouncedRefetch = useMemo(
    () =>
      throttle(refetch, 500, {
        leading: true,
        trailing: true,
      }),
    [refetch],
  )

  useEffect(() => {
    const unsub = messagesBus.on(
      events => {
        if (events.type !== 'logs') return

        events.logs.forEach(log => {
          if (ChatBskyConvoDefs.isLogBeginConvo(log)) {
            debouncedRefetch()
          } else if (ChatBskyConvoDefs.isLogLeaveConvo(log)) {
            queryClient.setQueryData(RQKEY, (old: ConvoListQueryData) =>
              optimisticDelete(log.convoId, old),
            )
          } else if (ChatBskyConvoDefs.isLogDeleteMessage(log)) {
            queryClient.setQueryData(RQKEY, (old: ConvoListQueryData) =>
              optimisticUpdate(log.convoId, old, convo =>
                log.message.id === convo.lastMessage?.id
                  ? {
                      ...convo,
                      rev: log.rev,
                      lastMessage: log.message,
                    }
                  : convo,
              ),
            )
          } else if (ChatBskyConvoDefs.isLogCreateMessage(log)) {
            queryClient.setQueryData(RQKEY, (old: ConvoListQueryData) => {
              if (!old) return old

              function updateConvo(convo: ChatBskyConvoDefs.ConvoView) {
                if (!ChatBskyConvoDefs.isLogCreateMessage(log)) return convo

                let unreadCount = convo.unreadCount
                if (convo.id !== currentConvoId) {
                  if (
                    ChatBskyConvoDefs.isMessageView(log.message) ||
                    ChatBskyConvoDefs.isDeletedMessageView(log.message)
                  ) {
                    if (log.message.sender.did !== currentAccount?.did) {
                      unreadCount++
                    }
                  }
                } else {
                  unreadCount = 0
                }

                return {
                  ...convo,
                  rev: log.rev,
                  lastMessage: log.message,
                  unreadCount,
                }
              }

              function filterConvoFromPage(
                convo: ChatBskyConvoDefs.ConvoView[],
              ) {
                return convo.filter(c => c.id !== log.convoId)
              }

              const existingConvo = getConvoFromQueryData(log.convoId, old)

              if (existingConvo) {
                return {
                  ...old,
                  pages: old.pages.map((page, i) => {
                    if (i === 0) {
                      return {
                        ...page,
                        convos: [
                          updateConvo(existingConvo),
                          ...filterConvoFromPage(page.convos),
                        ],
                      }
                    }
                    return {
                      ...page,
                      convos: filterConvoFromPage(page.convos),
                    }
                  }),
                }
              } else {
                /**
                 * We received a message from an conversation old enough that
                 * it doesn't exist in the query cache, meaning we need to
                 * refetch and bump the old convo to the top.
                 */
                debouncedRefetch()
              }
            })
          }
        })
      },
      {
        // get events for all chats
        convoId: undefined,
      },
    )

    return () => unsub()
  }, [
    messagesBus,
    currentConvoId,
    refetch,
    queryClient,
    currentAccount?.did,
    debouncedRefetch,
  ])

  const ctx = useMemo(() => {
    return data?.pages.flatMap(page => page.convos) ?? []
  }, [data])

  return (
    <ListConvosContext.Provider value={ctx}>
      {children}
    </ListConvosContext.Provider>
  )
}

export function useUnreadMessageCount() {
  const {currentConvoId} = useCurrentConvoId()
  const {currentAccount} = useSession()
  const convos = useListConvos()
  const moderationOpts = useModerationOpts()

  const count = useMemo(() => {
    return (
      convos
        .filter(convo => convo.id !== currentConvoId)
        .reduce((acc, convo) => {
          const otherMember = convo.members.find(
            member => member.did !== currentAccount?.did,
          )

          if (!otherMember || !moderationOpts) return acc

          const moderation = moderateProfile(otherMember, moderationOpts)
          const shouldIgnore =
            convo.muted ||
            moderation.blocked ||
            otherMember.did === 'missing.invalid'
          const unreadCount = !shouldIgnore && convo.unreadCount > 0 ? 1 : 0

          return acc + unreadCount
        }, 0) ?? 0
    )
  }, [convos, currentAccount?.did, currentConvoId, moderationOpts])

  return useMemo(() => {
    return {
      count,
      numUnread: count > 0 ? (count > 10 ? '10+' : String(count)) : undefined,
    }
  }, [count])
}

export type ConvoListQueryData = {
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

function optimisticUpdate(
  chatId: string,
  old: ConvoListQueryData,
  updateFn: (convo: ChatBskyConvoDefs.ConvoView) => ChatBskyConvoDefs.ConvoView,
) {
  if (!old) return old

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

function optimisticDelete(chatId: string, old: ConvoListQueryData) {
  if (!old) return old

  return {
    ...old,
    pages: old.pages.map(page => ({
      ...page,
      convos: page.convos.filter(convo => chatId !== convo.id),
    })),
  }
}

export function getConvoFromQueryData(chatId: string, old: ConvoListQueryData) {
  for (const page of old.pages) {
    for (const convo of page.convos) {
      if (convo.id === chatId) {
        return convo
      }
    }
  }
  return null
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
) {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<ChatBskyConvoListConvos.OutputSchema>
  >({
    queryKey: RQKEY,
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) {
      continue
    }

    for (const page of queryData.pages) {
      for (const convo of page.convos) {
        for (const member of convo.members) {
          if (member.did === did) {
            yield member
          }
        }
      }
    }
  }
}
