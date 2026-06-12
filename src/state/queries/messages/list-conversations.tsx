import {createContext, useCallback, useContext, useEffect, useMemo} from 'react'
import {
  ChatBskyConvoDefs,
  type ChatBskyConvoListConvos,
  moderateProfile,
  type ModerationOpts,
} from '@atproto/api'
import {
  type InfiniteData,
  type Query,
  type QueryClient,
  type QueryKey,
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
import {useAgeAssurance} from '#/ageAssurance'
import {type AgeAssuranceFlags} from '#/ageAssurance/types'
import {RQKEY_ROOT as REQUESTS_RQKEY_ROOT} from './list-conversation-requests'
import {handleConvoLogEvents} from './log-handler'

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
) => [RQKEY_ROOT, status, readState, kind, lockStatus, limit] as const

/**
 * Prefix key matching every convo-list query with the given status (and
 * optionally readState), regardless of the remaining params (kind,
 * lockStatus, limit). Only valid with prefix-matching APIs (setQueriesData,
 * getQueriesData, invalidateQueries) - exact-match APIs (getQueryData,
 * setQueryData) hash the full key and will never match a prefix.
 */
export const RQKEY_PARTIAL = (
  status: 'accepted' | 'request' | 'all',
  readState?: 'all' | 'unread',
) => (readState ? [RQKEY_ROOT, status, readState] : [RQKEY_ROOT, status])

/**
 * Whether a convo satisfies the filters encoded in a convo-list query key.
 * Caches are server-filtered, so optimistic inserts must apply the same
 * filters client-side or convos leak into lists that should exclude them.
 */
export function convoMatchesQueryKey(
  convo: ChatBskyConvoDefs.ConvoView,
  queryKey: QueryKey,
): boolean {
  const [, status, readState, kind, lockStatus] = queryKey as ReturnType<
    typeof RQKEY
  >
  if (status !== 'all' && status !== convo.status) return false
  if (readState === 'unread' && convo.unreadCount === 0) return false
  if (ChatBskyConvoDefs.isGroupConvo(convo.kind)) {
    if (kind === 'direct') return false
    if (lockStatus && convo.kind.lockStatus !== lockStatus) return false
  } else {
    if (kind === 'group') return false
    // direct convos are never locked
    if (lockStatus && lockStatus !== 'unlocked') return false
  }
  return true
}

/**
 * Query predicate for optimistically upserting a convo into convo-list
 * caches. Targets caches whose filters the convo satisfies, plus caches the
 * convo is already in - those get updated in place even if the convo no
 * longer matches (e.g. unreadCount dropped to 0), mirroring how read/mute
 * log events update convos in place everywhere.
 */
export function convoListQueryPredicate(convo: ChatBskyConvoDefs.ConvoView) {
  return (query: Query): boolean => {
    const data = query.state.data as ConvoListQueryData | undefined
    if (data && getConvoFromQueryData(convo.id, data)) return true
    return convoMatchesQueryKey(convo, query.queryKey)
  }
}

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
  const aa = useAgeAssurance()
  const {refetch, data} = useListConvosQuery({
    readState: 'unread',
    limit: UNREAD_LIMIT,
    lockStatus: 'unlocked',
    kind: aa.flags.groupChatDisabled ? 'direct' : 'all',
  })
  const messagesBus = useMessagesEventBus()
  const queryClient = useQueryClient()
  const {currentConvoId} = useCurrentConvoId()
  const {currentAccount} = useSession()

  const debouncedRefetch = useMemo(() => {
    const refetchAndInvalidate = () => {
      void refetch()
      void queryClient.invalidateQueries({queryKey: [RQKEY_ROOT]})
      void queryClient.invalidateQueries({queryKey: [REQUESTS_RQKEY_ROOT]})
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
        handleConvoLogEvents({
          queryClient,
          logs: events.logs,
          currentConvoId,
          currentAccountDid: currentAccount?.did,
          onRefetchNeeded: debouncedRefetch,
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
    queryClient,
    currentAccount?.did,
    debouncedRefetch,
  ])

  const ctx = useMemo(() => {
    const convos = data?.pages.flatMap(page => page.convos) ?? []
    return {
      accepted: convos.filter(conv => conv.status === 'accepted'),
      request: convos.filter(conv => conv.status === 'request'),
    }
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
  const {accepted, request} = useListConvos()
  const moderationOpts = useModerationOpts()
  const aa = useAgeAssurance()

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
      aa.flags,
    )
    const requestCount = calculateCount(
      request,
      currentAccount?.did,
      currentConvoId,
      moderationOpts,
      aa.flags,
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
  }, [
    accepted,
    request,
    currentAccount?.did,
    currentConvoId,
    moderationOpts,
    aa.flags,
  ])
}

function calculateCount(
  convos: ChatBskyConvoDefs.ConvoView[],
  currentAccountDid: string | undefined,
  currentConvoId: string | undefined,
  moderationOpts: ModerationOpts | undefined,
  flags: AgeAssuranceFlags,
) {
  return (
    convos
      .filter(convo => convo.id !== currentConvoId)
      .reduce((acc, convoView) => {
        const convo = parseConvoView(convoView, currentAccountDid)

        if (!convo || !moderationOpts) return acc

        if (convo.kind === 'group' && flags.groupChatDisabled) return acc

        const shouldIgnore =
          convo.view.muted ||
          !convo.primaryMember ||
          moderateProfile(convo.primaryMember, moderationOpts).blocked ||
          convo.primaryMember.handle === 'missing.invalid' ||
          (convo.kind === 'group' && convo.details.lockStatus !== 'unlocked')
        const unreadJoinRequestCount =
          convo.kind === 'group'
            ? (convo.details.unreadJoinRequestCount ?? 0)
            : 0

        const unreadCount =
          !shouldIgnore &&
          (convo.view.unreadCount > 0 || unreadJoinRequestCount > 0)
            ? 1
            : 0

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

export function optimisticUpdate(
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

export function optimisticDelete(chatId: string, old?: ConvoListQueryData) {
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
