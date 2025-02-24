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
  ModerationOpts,
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

export const RQKEY_ROOT = 'convo-list'
export const RQKEY = (status: 'accepted' | 'request' | 'all') => [
  'convo-list',
  status,
]
type RQPageParam = string | undefined

export function useListConvosQuery({
  enabled,
  status,
}: {
  enabled?: boolean
  status?: 'request' | 'accepted'
} = {}) {
  const agent = useAgent()

  return useInfiniteQuery({
    enabled,
    queryKey: RQKEY(status ?? 'all'),
    queryFn: async ({pageParam}) => {
      const {data} = await agent.chat.bsky.convo.listConvos(
        {
          limit: 20,
          cursor: pageParam,
          status,
        },
        {headers: DM_SERVICE_HEADERS},
      )
      return data
    },
    initialPageParam: undefined as RQPageParam,
    getNextPageParam: lastPage => lastPage.cursor,
  })
}

const ListConvosContext = createContext<{
  accepted: ChatBskyConvoDefs.ConvoView[]
  request: ChatBskyConvoDefs.ConvoView[]
} | null>(null)

export function useListConvos() {
  const ctx = useContext(ListConvosContext)
  if (!ctx) {
    throw new Error('useListConvos must be used within a ListConvosProvider')
  }
  return ctx
}

const empty = {accepted: [], request: []}
export function ListConvosProvider({children}: {children: React.ReactNode}) {
  const {hasSession} = useSession()

  if (!hasSession) {
    return (
      <ListConvosContext.Provider value={empty}>
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
  const {refetch: acceptedRefetch, data: acceptedData} = useListConvosQuery({
    status: 'accepted',
  })
  const {refetch: requestRefetch, data: requestData} = useListConvosQuery({
    status: 'request',
  })
  const messagesBus = useMessagesEventBus()
  const queryClient = useQueryClient()
  const {currentConvoId} = useCurrentConvoId()
  const {currentAccount} = useSession()

  const debouncedRefetch = useMemo(() => {
    const refetch = () => {
      acceptedRefetch()
      requestRefetch()
    }
    return throttle(refetch, 500, {
      leading: true,
      trailing: true,
    })
  }, [acceptedRefetch, requestRefetch])

  useEffect(() => {
    const unsub = messagesBus.on(
      events => {
        if (events.type !== 'logs') return

        for (const log of events.logs) {
          if (ChatBskyConvoDefs.isLogBeginConvo(log)) {
            debouncedRefetch()
          } else if (ChatBskyConvoDefs.isLogLeaveConvo(log)) {
            queryClient.setQueryData([RQKEY_ROOT], (old: ConvoListQueryData) =>
              optimisticDelete(log.convoId, old),
            )
          } else if (ChatBskyConvoDefs.isLogDeleteMessage(log)) {
            queryClient.setQueryData([RQKEY_ROOT], (old: ConvoListQueryData) =>
              optimisticUpdate(log.convoId, old, convo => {
                if (
                  (ChatBskyConvoDefs.isDeletedMessageView(log.message) ||
                    ChatBskyConvoDefs.isMessageView(log.message)) &&
                  (ChatBskyConvoDefs.isDeletedMessageView(convo.lastMessage) ||
                    ChatBskyConvoDefs.isMessageView(convo.lastMessage))
                ) {
                  return log.message.id === convo.lastMessage.id
                    ? {
                        ...convo,
                        rev: log.rev,
                        lastMessage: log.message,
                      }
                    : convo
                } else {
                  return convo
                }
              }),
            )
          } else if (ChatBskyConvoDefs.isLogCreateMessage(log)) {
            // Store in a new var to avoid TS errors due to closures.
            const logRef: ChatBskyConvoDefs.LogCreateMessage = log

            queryClient.setQueryData(
              [RQKEY_ROOT],
              (old: ConvoListQueryData) => {
                if (!old) return old

                function updateConvo(convo: ChatBskyConvoDefs.ConvoView) {
                  let unreadCount = convo.unreadCount
                  if (convo.id !== currentConvoId) {
                    if (
                      ChatBskyConvoDefs.isMessageView(logRef.message) ||
                      ChatBskyConvoDefs.isDeletedMessageView(logRef.message)
                    ) {
                      if (logRef.message.sender.did !== currentAccount?.did) {
                        unreadCount++
                      }
                    }
                  } else {
                    unreadCount = 0
                  }

                  return {
                    ...convo,
                    rev: logRef.rev,
                    lastMessage: logRef.message,
                    unreadCount,
                  }
                }

                function filterConvoFromPage(
                  convo: ChatBskyConvoDefs.ConvoView[],
                ) {
                  return convo.filter(c => c.id !== logRef.convoId)
                }

                const existingConvo = getConvoFromQueryData(logRef.convoId, old)

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
              },
            )
          }
        }
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
    queryClient,
    currentAccount?.did,
    debouncedRefetch,
  ])

  const ctx = useMemo(() => {
    return {
      accepted: acceptedData?.pages.flatMap(page => page.convos) ?? [],
      request: requestData?.pages.flatMap(page => page.convos) ?? [],
    }
  }, [acceptedData, requestData])

  return (
    <ListConvosContext.Provider value={ctx}>
      {children}
    </ListConvosContext.Provider>
  )
}

export function useUnreadMessageCount() {
  const {currentConvoId} = useCurrentConvoId()
  const {currentAccount} = useSession()
  const {accepted, request} = useListConvos()
  const moderationOpts = useModerationOpts()

  return useMemo<{
    count: number
    numUnread?: string
    hasNew: boolean
  }>(() => {
    const acceptedCount = calculateCount(
      accepted,
      currentAccount?.did,
      currentConvoId,
      moderationOpts,
    )
    const requestCount = calculateCount(
      request,
      currentAccount?.did,
      currentConvoId,
      moderationOpts,
    )
    if (acceptedCount > 0) {
      const total = acceptedCount + Math.min(requestCount, 1)
      return {
        count: total,
        numUnread: total > 10 ? '10+' : String(total),
        // only needed when numUnread is undefined
        hasNew: false,
      }
    } else if (requestCount > 0) {
      return {
        count: 1,
        numUnread: undefined,
        hasNew: true,
      }
    } else {
      return {
        count: 0,
        numUnread: undefined,
        hasNew: false,
      }
    }
  }, [accepted, request, currentAccount?.did, currentConvoId, moderationOpts])
}

function calculateCount(
  convos: ChatBskyConvoDefs.ConvoView[],
  currentAccountDid: string | undefined,
  currentConvoId: string | undefined,
  moderationOpts: ModerationOpts | undefined,
) {
  return (
    convos
      .filter(convo => convo.id !== currentConvoId)
      .reduce((acc, convo) => {
        const otherMember = convo.members.find(
          member => member.did !== currentAccountDid,
        )

        if (!otherMember || !moderationOpts) return acc

        const moderation = moderateProfile(otherMember, moderationOpts)
        const shouldIgnore =
          convo.muted ||
          moderation.blocked ||
          otherMember.handle === 'missing.invalid'
        const unreadCount = !shouldIgnore && convo.unreadCount > 0 ? 1 : 0

        return acc + unreadCount
      }, 0) ?? 0
  )
}

export type ConvoListQueryData = {
  pageParams: Array<string | undefined>
  pages: Array<ChatBskyConvoListConvos.OutputSchema>
}

export function useOnMarkAsRead() {
  const queryClient = useQueryClient()

  return useCallback(
    (chatId: string) => {
      queryClient.setQueryData([RQKEY_ROOT], (old: ConvoListQueryData) => {
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
    queryKey: [RQKEY_ROOT],
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
