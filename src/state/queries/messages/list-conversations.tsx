import {createContext, useCallback, useContext, useEffect, useMemo} from 'react'
import {
  ChatBskyConvoDefs,
  type ChatBskyConvoListConvos,
  moderateProfile,
  type ModerationOpts,
} from '@atproto/api'
import {
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query'
import throttle from 'lodash.throttle'

import {useCurrentConvoId} from '#/state/messages/current-convo-id'
import {useMessagesEventBus} from '#/state/messages/events'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {DM_SERVICE_HEADERS} from '#/state/queries/messages/const'
import {useAgent, useSession} from '#/state/session'
import {useLeftConvos} from './leave-conversation'

export const RQKEY_ROOT = 'convo-list'
export const RQKEY = (
  status: 'accepted' | 'request' | 'all',
  readState: 'all' | 'unread' = 'all',
) => [RQKEY_ROOT, status, readState]
type RQPageParam = string | undefined

export function useListConvosQuery({
  enabled,
  status,
  readState = 'all',
}: {
  enabled?: boolean
  status?: 'request' | 'accepted'
  readState?: 'all' | 'unread'
} = {}) {
  const agent = useAgent()

  return useInfiniteQuery({
    enabled,
    queryKey: RQKEY(status ?? 'all', readState),
    queryFn: async ({pageParam}) => {
      const {data} = await agent.chat.bsky.convo.listConvos(
        {
          limit: 20,
          cursor: pageParam,
          readState: readState === 'unread' ? 'unread' : undefined,
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
  const {refetch, data} = useListConvosQuery({readState: 'unread'})
  const messagesBus = useMessagesEventBus()
  const queryClient = useQueryClient()
  const {currentConvoId} = useCurrentConvoId()
  const {currentAccount} = useSession()
  const leftConvos = useLeftConvos()

  const debouncedRefetch = useMemo(() => {
    const refetchAndInvalidate = () => {
      refetch()
      queryClient.invalidateQueries({queryKey: [RQKEY_ROOT]})
    }
    return throttle(refetchAndInvalidate, 500, {
      leading: true,
      trailing: true,
    })
  }, [refetch, queryClient])

  useEffect(() => {
    const unsub = messagesBus.on(
      events => {
        if (events.type !== 'logs') return

        for (const log of events.logs) {
          if (ChatBskyConvoDefs.isLogBeginConvo(log)) {
            debouncedRefetch()
          } else if (ChatBskyConvoDefs.isLogLeaveConvo(log)) {
            queryClient.setQueriesData(
              {queryKey: [RQKEY_ROOT]},
              (old?: ConvoListQueryData) => optimisticDelete(log.convoId, old),
            )
          } else if (ChatBskyConvoDefs.isLogDeleteMessage(log)) {
            queryClient.setQueriesData(
              {queryKey: [RQKEY_ROOT]},
              (old?: ConvoListQueryData) =>
                optimisticUpdate(log.convoId, old, convo => {
                  if (
                    (ChatBskyConvoDefs.isDeletedMessageView(log.message) ||
                      ChatBskyConvoDefs.isMessageView(log.message)) &&
                    (ChatBskyConvoDefs.isDeletedMessageView(
                      convo.lastMessage,
                    ) ||
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

            // Get all matching queries
            const queries = queryClient.getQueriesData<ConvoListQueryData>({
              queryKey: [RQKEY_ROOT],
            })

            // Check if convo exists in any query
            let foundConvo: ChatBskyConvoDefs.ConvoView | null = null
            for (const [_key, query] of queries) {
              if (!query) continue
              const convo = getConvoFromQueryData(logRef.convoId, query)
              if (convo) {
                foundConvo = convo
                break
              }
            }

            if (!foundConvo) {
              // Convo not found, trigger refetch
              debouncedRefetch()
              return
            }

            // Update the convo
            const updatedConvo = {
              ...foundConvo,
              rev: logRef.rev,
              lastMessage: logRef.message,
              unreadCount:
                foundConvo.id !== currentConvoId
                  ? (ChatBskyConvoDefs.isMessageView(logRef.message) ||
                      ChatBskyConvoDefs.isDeletedMessageView(logRef.message)) &&
                    logRef.message.sender.did !== currentAccount?.did
                    ? foundConvo.unreadCount + 1
                    : foundConvo.unreadCount
                  : 0,
            }

            function filterConvoFromPage(convo: ChatBskyConvoDefs.ConvoView[]) {
              return convo.filter(c => c.id !== logRef.convoId)
            }

            // Update all matching queries
            function updateFn(old?: ConvoListQueryData) {
              if (!old) return old
              return {
                ...old,
                pages: old.pages.map((page, i) => {
                  if (i === 0) {
                    return {
                      ...page,
                      convos: [
                        updatedConvo,
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
            }
            // always update the unread one
            queryClient.setQueriesData(
              {queryKey: RQKEY('all', 'unread')},
              (old?: ConvoListQueryData) =>
                old
                  ? updateFn(old)
                  : ({
                      pageParams: [undefined],
                      pages: [{convos: [updatedConvo], cursor: undefined}],
                    } satisfies ConvoListQueryData),
            )
            // update the other ones based on status of the incoming message
            if (updatedConvo.status === 'accepted') {
              queryClient.setQueriesData(
                {queryKey: RQKEY('accepted')},
                updateFn,
              )
            } else if (updatedConvo.status === 'request') {
              queryClient.setQueriesData({queryKey: RQKEY('request')}, updateFn)
            }
          } else if (ChatBskyConvoDefs.isLogReadMessage(log)) {
            const logRef: ChatBskyConvoDefs.LogReadMessage = log
            queryClient.setQueriesData(
              {queryKey: [RQKEY_ROOT]},
              (old?: ConvoListQueryData) =>
                optimisticUpdate(logRef.convoId, old, convo => ({
                  ...convo,
                  unreadCount: 0,
                  rev: logRef.rev,
                })),
            )
          } else if (ChatBskyConvoDefs.isLogAcceptConvo(log)) {
            const logRef: ChatBskyConvoDefs.LogAcceptConvo = log
            const requests = queryClient.getQueryData<ConvoListQueryData>(
              RQKEY('request'),
            )
            if (!requests) {
              debouncedRefetch()
              return
            }
            const acceptedConvo = getConvoFromQueryData(log.convoId, requests)
            if (!acceptedConvo) {
              debouncedRefetch()
              return
            }
            queryClient.setQueryData(
              RQKEY('request'),
              (old?: ConvoListQueryData) =>
                optimisticDelete(logRef.convoId, old),
            )
            queryClient.setQueriesData(
              {queryKey: RQKEY('accepted')},
              (old?: ConvoListQueryData) => {
                if (!old) {
                  debouncedRefetch()
                  return old
                }
                return {
                  ...old,
                  pages: old.pages.map((page, i) => {
                    if (i === 0) {
                      return {
                        ...page,
                        convos: [
                          {...acceptedConvo, status: 'accepted'},
                          ...page.convos,
                        ],
                      }
                    }
                    return page
                  }),
                }
              },
            )
          } else if (ChatBskyConvoDefs.isLogMuteConvo(log)) {
            const logRef: ChatBskyConvoDefs.LogMuteConvo = log
            queryClient.setQueriesData(
              {queryKey: [RQKEY_ROOT]},
              (old?: ConvoListQueryData) =>
                optimisticUpdate(logRef.convoId, old, convo => ({
                  ...convo,
                  muted: true,
                  rev: logRef.rev,
                })),
            )
          } else if (ChatBskyConvoDefs.isLogUnmuteConvo(log)) {
            const logRef: ChatBskyConvoDefs.LogUnmuteConvo = log
            queryClient.setQueriesData(
              {queryKey: [RQKEY_ROOT]},
              (old?: ConvoListQueryData) =>
                optimisticUpdate(logRef.convoId, old, convo => ({
                  ...convo,
                  muted: false,
                  rev: logRef.rev,
                })),
            )
          } else if (ChatBskyConvoDefs.isLogAddReaction(log)) {
            const logRef: ChatBskyConvoDefs.LogAddReaction = log
            queryClient.setQueriesData(
              {queryKey: [RQKEY_ROOT]},
              (old?: ConvoListQueryData) =>
                optimisticUpdate(logRef.convoId, old, convo => ({
                  ...convo,
                  lastReaction: {
                    $type: 'chat.bsky.convo.defs#messageAndReactionView',
                    reaction: logRef.reaction,
                    message: logRef.message,
                  },
                  rev: logRef.rev,
                })),
            )
          } else if (ChatBskyConvoDefs.isLogRemoveReaction(log)) {
            const logRef: ChatBskyConvoDefs.LogRemoveReaction = log
            queryClient.setQueriesData(
              {queryKey: [RQKEY_ROOT]},
              (old?: ConvoListQueryData) =>
                optimisticUpdate(logRef.convoId, old, convo => {
                  if (
                    // if the convo is the same
                    logRef.convoId === convo.id &&
                    ChatBskyConvoDefs.isMessageAndReactionView(
                      convo.lastReaction,
                    ) &&
                    ChatBskyConvoDefs.isMessageView(logRef.message) &&
                    // ...and the message is the same
                    convo.lastReaction.message.id === logRef.message.id &&
                    // ...and the reaction is the same
                    convo.lastReaction.reaction.sender.did ===
                      logRef.reaction.sender.did &&
                    convo.lastReaction.reaction.value === logRef.reaction.value
                  ) {
                    return {
                      ...convo,
                      // ...remove the reaction. hopefully they didn't react twice in a row!
                      lastReaction: undefined,
                      rev: logRef.rev,
                    }
                  } else {
                    return convo
                  }
                }),
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
    const convos =
      data?.pages
        .flatMap(page => page.convos)
        .filter(convo => !leftConvos.includes(convo.id)) ?? []
    return {
      accepted: convos.filter(conv => conv.status === 'accepted'),
      request: convos.filter(conv => conv.status === 'request'),
    }
  }, [data, leftConvos])

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
      queryClient.setQueriesData(
        {queryKey: [RQKEY_ROOT]},
        (old?: ConvoListQueryData) => {
          if (!old) return old
          return optimisticUpdate(chatId, old, convo => ({
            ...convo,
            unreadCount: 0,
          }))
        },
      )
    },
    [queryClient],
  )
}

function optimisticUpdate(
  chatId: string,
  old?: ConvoListQueryData,
  updateFn?: (
    convo: ChatBskyConvoDefs.ConvoView,
  ) => ChatBskyConvoDefs.ConvoView,
) {
  if (!old || !updateFn) return old

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

function optimisticDelete(chatId: string, old?: ConvoListQueryData) {
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
