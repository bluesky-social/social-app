import {createContext, useCallback, useContext, useEffect, useMemo} from 'react'
import {
  type ChatBskyActorDefs,
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

import {DM_SERVICE_HEADERS} from '#/lib/constants'
import {useCurrentConvoId} from '#/state/messages/current-convo-id'
import {useMessagesEventBus} from '#/state/messages/events'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useAgent, useSession} from '#/state/session'
import {parseConvoView} from '#/components/dms/util'
import * as bsky from '#/types/bsky'
import {RQKEY as CONVO_KEY} from './conversation'
import {useLeftConvos} from './leave-conversation'
import {listConvoMembersQueryKey} from './list-convo-members'

const DEFAULT_LIMIT = 10
export const UNREAD_LIMIT = 20

export const RQKEY_ROOT = 'convo-list'
export const RQKEY = (
  status: 'accepted' | 'request' | 'all',
  readState: 'all' | 'unread' = 'all',
  kind: 'all' | 'group' | 'direct' = 'all',
  lockStatus:
    | 'unlocked'
    | 'locked'
    | 'locked-permanently'
    | undefined = undefined,
  limit?: number,
) => [RQKEY_ROOT, status, readState, kind, lockStatus, limit]
type RQPageParam = string | undefined

export function useListConvosQuery({
  enabled,
  status,
  readState = 'all',
  kind = 'all',
  limit = DEFAULT_LIMIT,
  lockStatus,
}: {
  enabled?: boolean
  status?: 'request' | 'accepted'
  readState?: 'all' | 'unread'
  kind?: 'all' | 'group' | 'direct'
  limit?: number
  lockStatus?: 'unlocked' | 'locked' | 'locked-permanently'
} = {}) {
  const agent = useAgent()

  return useInfiniteQuery({
    enabled,
    queryKey: RQKEY(status ?? 'all', readState, kind, lockStatus, limit),
    queryFn: async ({pageParam}) => {
      const {data} = await agent.chat.bsky.convo.listConvos(
        {
          limit,
          cursor: pageParam,
          readState: readState === 'unread' ? 'unread' : undefined,
          kind: kind === 'all' ? undefined : kind,
          lockStatus,
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
ListConvosContext.displayName = 'ListConvosContext'

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
  const {refetch, data} = useListConvosQuery({
    readState: 'unread',
    limit: UNREAD_LIMIT,
    lockStatus: 'unlocked',
  })
  const messagesBus = useMessagesEventBus()
  const queryClient = useQueryClient()
  const {currentConvoId} = useCurrentConvoId()
  const {currentAccount} = useSession()
  const leftConvos = useLeftConvos()

  const debouncedRefetch = useMemo(() => {
    const refetchAndInvalidate = () => {
      void refetch()
      void queryClient.invalidateQueries({queryKey: [RQKEY_ROOT]})
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

        function mutateMembers(
          convoId: string,
          fn: (
            members: ChatBskyActorDefs.ProfileViewBasic[],
          ) => ChatBskyActorDefs.ProfileViewBasic[],
        ) {
          queryClient.setQueryData<ChatBskyActorDefs.ProfileViewBasic[]>(
            listConvoMembersQueryKey(convoId),
            old => {
              if (!old) return // query doesn't exist yet, skip
              return fn(old)
            },
          )
        }

        function mutateConvoView(
          convoId: string,
          fn: (
            convo: ChatBskyConvoDefs.ConvoView,
          ) => ChatBskyConvoDefs.ConvoView,
        ) {
          queryClient.setQueryData<ChatBskyConvoDefs.ConvoView>(
            CONVO_KEY(convoId),
            old => (old ? fn(old) : old),
          )
          queryClient.setQueriesData<ConvoListQueryData>(
            {queryKey: [RQKEY_ROOT]},
            old => optimisticUpdate(convoId, old, fn),
          )
        }

        function handleMemberAdded(
          convoId: string,
          did: string,
          relatedProfiles: ChatBskyActorDefs.ProfileViewBasic[],
          rev: string,
        ) {
          const newMember = relatedProfiles.find(r => r.did === did)
          if (!newMember) return
          // If the optimistic add already added them, skip the
          // memberCount bump to avoid double-counting.
          const alreadyKnownMember =
            queryClient
              .getQueryData<
                ChatBskyActorDefs.ProfileViewBasic[]
              >(listConvoMembersQueryKey(convoId))
              ?.some(m => m.did === did) ?? false
          mutateMembers(convoId, list =>
            list.some(m => m.did === did) ? list : list.concat(newMember),
          )
          mutateConvoView(convoId, convo =>
            addMemberToConvoView(convo, newMember, rev, alreadyKnownMember),
          )
        }

        function handleMemberRemoved(
          convoId: string,
          did: string,
          rev: string,
        ) {
          // If the optimistic remove already dropped them from the full
          // list, skip the memberCount decrement to avoid double-counting.
          const alreadyRemovedMember =
            queryClient
              .getQueryData<
                ChatBskyActorDefs.ProfileViewBasic[]
              >(listConvoMembersQueryKey(convoId))
              ?.some(m => m.did === did) === false
          mutateMembers(convoId, list => list.filter(m => m.did !== did))
          mutateConvoView(convoId, convo =>
            removeMemberFromConvoView(convo, did, rev, alreadyRemovedMember),
          )
        }

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
            queryClient.setQueriesData(
              {queryKey: [RQKEY_ROOT]},
              (old?: ConvoListQueryData) =>
                optimisticUpdate(log.convoId, old, convo => ({
                  ...convo,
                  unreadCount: 0,
                  rev: log.rev,
                })),
            )
          } else if (ChatBskyConvoDefs.isLogReadConvo(log)) {
            queryClient.setQueriesData(
              {queryKey: [RQKEY_ROOT]},
              (old?: ConvoListQueryData) =>
                optimisticUpdate(log.convoId, old, convo => ({
                  ...convo,
                  unreadCount: 0,
                  rev: log.rev,
                })),
            )
          } else if (ChatBskyConvoDefs.isLogAcceptConvo(log)) {
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
              (old?: ConvoListQueryData) => optimisticDelete(log.convoId, old),
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
            queryClient.setQueriesData(
              {queryKey: [RQKEY_ROOT]},
              (old?: ConvoListQueryData) =>
                optimisticUpdate(log.convoId, old, convo => ({
                  ...convo,
                  muted: true,
                  rev: log.rev,
                })),
            )
          } else if (ChatBskyConvoDefs.isLogUnmuteConvo(log)) {
            queryClient.setQueriesData(
              {queryKey: [RQKEY_ROOT]},
              (old?: ConvoListQueryData) =>
                optimisticUpdate(log.convoId, old, convo => ({
                  ...convo,
                  muted: false,
                  rev: log.rev,
                })),
            )
          } else if (ChatBskyConvoDefs.isLogLockConvo(log)) {
            mutateConvoView(log.convoId, convo =>
              ChatBskyConvoDefs.isGroupConvo(convo.kind)
                ? {
                    ...convo,
                    kind: {...convo.kind, lockStatus: 'locked'},
                    rev: log.rev,
                  }
                : {...convo, rev: log.rev},
            )
          } else if (ChatBskyConvoDefs.isLogUnlockConvo(log)) {
            mutateConvoView(log.convoId, convo =>
              ChatBskyConvoDefs.isGroupConvo(convo.kind)
                ? {
                    ...convo,
                    kind: {...convo.kind, lockStatus: 'unlocked'},
                    rev: log.rev,
                  }
                : {...convo, rev: log.rev},
            )
          } else if (ChatBskyConvoDefs.isLogLockConvoPermanently(log)) {
            mutateConvoView(log.convoId, convo =>
              ChatBskyConvoDefs.isGroupConvo(convo.kind)
                ? {
                    ...convo,
                    kind: {...convo.kind, lockStatus: 'locked-permanently'},
                    rev: log.rev,
                  }
                : {...convo, rev: log.rev},
            )
          } else if (
            ChatBskyConvoDefs.isLogCreateJoinLink(log) ||
            ChatBskyConvoDefs.isLogEditJoinLink(log) ||
            ChatBskyConvoDefs.isLogEnableJoinLink(log) ||
            ChatBskyConvoDefs.isLogDisableJoinLink(log)
          ) {
            // Join link data not included in the log event, trigger refetch to get it
            debouncedRefetch()
          } else if (
            ChatBskyConvoDefs.isLogApproveJoinRequest(log) ||
            ChatBskyConvoDefs.isLogRejectJoinRequest(log)
          ) {
            queryClient.setQueriesData(
              {queryKey: [RQKEY_ROOT]},
              (old?: ConvoListQueryData) =>
                updateGroupConvoJoinRequestCount(log, old, -1),
            )
          } else if (ChatBskyConvoDefs.isLogIncomingJoinRequest(log)) {
            queryClient.setQueriesData(
              {queryKey: [RQKEY_ROOT]},
              (old?: ConvoListQueryData) =>
                updateGroupConvoJoinRequestCount(log, old, 1),
            )
          } else if (ChatBskyConvoDefs.isLogOutgoingJoinRequest(log)) {
            // Viewer isn't in the chat yet, no need to do anything
          } else if (ChatBskyConvoDefs.isLogAddReaction(log)) {
            queryClient.setQueriesData(
              {queryKey: [RQKEY_ROOT]},
              (old?: ConvoListQueryData) =>
                optimisticUpdate(log.convoId, old, convo => ({
                  ...convo,
                  lastReaction: {
                    $type: 'chat.bsky.convo.defs#messageAndReactionView',
                    reaction: log.reaction,
                    message: log.message,
                  },
                  rev: log.rev,
                })),
            )
          } else if (ChatBskyConvoDefs.isLogAddMember(log)) {
            const data = log.message.data
            if (
              bsky.dangerousIsType<ChatBskyConvoDefs.SystemMessageDataAddMember>(
                data,
                ChatBskyConvoDefs.isSystemMessageDataAddMember,
              )
            ) {
              handleMemberAdded(
                log.convoId,
                data.member.did,
                log.relatedProfiles,
                log.rev,
              )
            }
            // Refetch so the server can refresh the curated members list.
            void queryClient.invalidateQueries({
              queryKey: CONVO_KEY(log.convoId),
            })
            debouncedRefetch()
          } else if (ChatBskyConvoDefs.isLogRemoveMember(log)) {
            const data = log.message.data
            if (
              bsky.dangerousIsType<ChatBskyConvoDefs.SystemMessageDataRemoveMember>(
                data,
                ChatBskyConvoDefs.isSystemMessageDataRemoveMember,
              )
            ) {
              handleMemberRemoved(log.convoId, data.member.did, log.rev)
            }
            // Refetch so the server can refill the curated members list.
            void queryClient.invalidateQueries({
              queryKey: CONVO_KEY(log.convoId),
            })
            debouncedRefetch()
          } else if (ChatBskyConvoDefs.isLogMemberJoin(log)) {
            const data = log.message.data
            if (
              bsky.dangerousIsType<ChatBskyConvoDefs.SystemMessageDataMemberJoin>(
                data,
                ChatBskyConvoDefs.isSystemMessageDataMemberJoin,
              )
            ) {
              handleMemberAdded(
                log.convoId,
                data.member.did,
                log.relatedProfiles,
                log.rev,
              )
            }
            void queryClient.invalidateQueries({
              queryKey: CONVO_KEY(log.convoId),
            })
            debouncedRefetch()
          } else if (ChatBskyConvoDefs.isLogMemberLeave(log)) {
            const data = log.message.data
            if (
              bsky.dangerousIsType<ChatBskyConvoDefs.SystemMessageDataMemberLeave>(
                data,
                ChatBskyConvoDefs.isSystemMessageDataMemberLeave,
              )
            ) {
              handleMemberRemoved(log.convoId, data.member.did, log.rev)
            }
            void queryClient.invalidateQueries({
              queryKey: CONVO_KEY(log.convoId),
            })
            debouncedRefetch()
          } else if (ChatBskyConvoDefs.isLogRemoveReaction(log)) {
            queryClient.setQueriesData(
              {queryKey: [RQKEY_ROOT]},
              (old?: ConvoListQueryData) =>
                optimisticUpdate(log.convoId, old, convo => {
                  if (
                    // if the convo is the same
                    log.convoId === convo.id &&
                    ChatBskyConvoDefs.isMessageAndReactionView(
                      convo.lastReaction,
                    ) &&
                    ChatBskyConvoDefs.isMessageView(log.message) &&
                    // ...and the message is the same
                    convo.lastReaction.message.id === log.message.id &&
                    // ...and the reaction is the same
                    convo.lastReaction.reaction.sender.did ===
                      log.reaction.sender.did &&
                    convo.lastReaction.reaction.value === log.reaction.value
                  ) {
                    return {
                      ...convo,
                      // ...remove the reaction. hopefully they didn't react twice in a row!
                      lastReaction: undefined,
                      rev: log.rev,
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
      .reduce((acc, convoView) => {
        const convo = parseConvoView(convoView, currentAccountDid)

        if (!convo || !moderationOpts) return acc

        const shouldIgnore =
          convo.view.muted ||
          !convo.primaryMember ||
          moderateProfile(convo.primaryMember, moderationOpts).blocked ||
          convo.primaryMember.handle === 'missing.invalid' ||
          (convo.kind === 'group' && convo.details.lockStatus !== 'unlocked')
        const unreadCount = !shouldIgnore && convo.view.unreadCount > 0 ? 1 : 0

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

function updateGroupConvoJoinRequestCount(
  log: {convoId: string; rev: string},
  old: ConvoListQueryData | undefined,
  delta: 1 | -1,
) {
  return optimisticUpdate(log.convoId, old, convo => {
    // Join requests are only meaningful for group convos.
    if (!ChatBskyConvoDefs.isGroupConvo(convo.kind)) {
      return {...convo, rev: log.rev}
    }
    const current = convo.kind.joinRequestCount ?? 0
    const next = Math.max(0, current + delta)
    return {
      ...convo,
      kind: {
        ...convo.kind,
        joinRequestCount: next === 0 ? undefined : next,
      },
      rev: log.rev,
    }
  })
}

function removeMemberFromConvoView(
  convo: ChatBskyConvoDefs.ConvoView,
  did: string,
  rev: string,
  alreadyRemovedMember: boolean,
): ChatBskyConvoDefs.ConvoView {
  // Member add/remove/join/leave events are only meaningful for group convos.
  if (!ChatBskyConvoDefs.isGroupConvo(convo.kind)) return convo
  const nextMembers = convo.members.filter(m => m.did !== did)
  return {
    ...convo,
    rev,
    members: nextMembers,
    kind: {
      ...convo.kind,
      memberCount: alreadyRemovedMember
        ? convo.kind.memberCount
        : Math.max(0, convo.kind.memberCount - 1),
    },
  }
}

function addMemberToConvoView(
  convo: ChatBskyConvoDefs.ConvoView,
  member: ChatBskyActorDefs.ProfileViewBasic,
  rev: string,
  alreadyKnownMember: boolean,
): ChatBskyConvoDefs.ConvoView {
  // Member add/remove/join/leave events are only meaningful for group convos.
  if (!ChatBskyConvoDefs.isGroupConvo(convo.kind)) return convo
  const alreadyInCuratedList = convo.members.some(m => m.did === member.did)
  const nextMembers = alreadyInCuratedList
    ? convo.members
    : convo.members.concat(member)
  return {
    ...convo,
    rev,
    members: nextMembers,
    kind: {
      ...convo.kind,
      memberCount: alreadyKnownMember
        ? convo.kind.memberCount
        : convo.kind.memberCount + 1,
    },
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
