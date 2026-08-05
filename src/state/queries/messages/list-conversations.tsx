import {useCallback, useEffect, useMemo} from 'react'
import {
  type InfiniteData,
  type Query,
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query'
import throttle from 'lodash.throttle'

import {useCurrentConvoId} from '#/state/messages/current-convo-id'
import {useMessagesEventBus} from '#/state/messages/events'
import {invalidateJoinLinkPreviewsForConvo} from '#/state/queries/join-links'
import {useChatClient, useSession} from '#/state/session'
import {chat} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {RQKEY as CONVO_KEY} from './conversation'
import {
  RQKEY_PARTIAL as UNREAD_COUNTS_RQKEY_PARTIAL,
  UNREAD_ACCEPTED_CAP,
  useUnreadCountsQuery,
} from './get-unread-counts'
import {
  type ConvoRequestListQueryData,
  optimisticDelete as optimisticDeleteRequest,
  optimisticDeleteJoinRequest,
  optimisticUpdate as optimisticUpdateRequest,
  RQKEY_ROOT as REQUESTS_RQKEY_ROOT,
} from './list-conversation-requests'
import {listConvoMembersQueryKey} from './list-convo-members'

const DEFAULT_LIMIT = 10

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
  convo: chat.bsky.convo.defs.ConvoView,
  queryKey: QueryKey,
): boolean {
  const [, status, readState, kind, lockStatus] = queryKey as ReturnType<
    typeof RQKEY
  >
  if (status !== 'all' && status !== convo.status) return false
  if (readState === 'unread' && convo.unreadCount === 0) return false
  if (bsky.isType(chat.bsky.convo.defs.groupConvo, convo.kind)) {
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
export function convoListQueryPredicate(convo: chat.bsky.convo.defs.ConvoView) {
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
  const chatClient = useChatClient()

  return useInfiniteQuery({
    enabled,
    queryKey: RQKEY(status ?? 'all', readState, kind, lockStatus, limit),
    queryFn: async ({pageParam}) => {
      return await chatClient.call(chat.bsky.convo.listConvos, {
        limit,
        cursor: pageParam,
        readState: readState === 'unread' ? 'unread' : undefined,
        kind: kind === 'all' ? undefined : kind,
        lockStatus,
        status,
      })
    },
    initialPageParam: undefined as RQPageParam,
    getNextPageParam: lastPage => lastPage.cursor,
  })
}

export function ListConvosProvider({children}: {children: React.ReactNode}) {
  const {hasSession} = useSession()

  if (!hasSession) {
    return <>{children}</>
  }

  return <ListConvosProviderInner>{children}</ListConvosProviderInner>
}

export function ListConvosProviderInner({
  children,
}: {
  children: React.ReactNode
}) {
  const messagesBus = useMessagesEventBus()
  const queryClient = useQueryClient()
  const {currentConvoId} = useCurrentConvoId()
  const {currentAccount} = useSession()

  const debouncedRefetch = useMemo(() => {
    const refetchAndInvalidate = () => {
      void queryClient.invalidateQueries({queryKey: [RQKEY_ROOT]})
      void queryClient.invalidateQueries({queryKey: [REQUESTS_RQKEY_ROOT]})
    }
    return throttle(refetchAndInvalidate, 500, {
      leading: true,
      trailing: true,
    })
  }, [queryClient])

  // The unread badge count is derived from chat.bsky.convo.getUnreadCounts.
  // Any chat log can change it, so refresh it (throttled) on every batch.
  const debouncedInvalidateUnreadCounts = useMemo(() => {
    return throttle(
      () => {
        void queryClient.invalidateQueries({
          queryKey: UNREAD_COUNTS_RQKEY_PARTIAL,
        })
      },
      500,
      {leading: true, trailing: true},
    )
  }, [queryClient])

  useEffect(() => {
    const unsub = messagesBus.on(
      events => {
        if (events.type !== 'logs') return

        // Any log batch may change unread state (new message, read, accept,
        // join request, etc.), so refresh the badge count for all of them.
        debouncedInvalidateUnreadCounts()

        function mutateMembers(
          convoId: string,
          fn: (
            members: chat.bsky.actor.defs.ProfileViewBasic[],
          ) => chat.bsky.actor.defs.ProfileViewBasic[],
        ) {
          queryClient.setQueryData<chat.bsky.actor.defs.ProfileViewBasic[]>(
            listConvoMembersQueryKey(convoId),
            old => {
              if (!old) return // query doesn't exist yet, skip
              return fn(old)
            },
          )
        }

        function updateConvoInAllLists(
          convoId: string,
          fn: (
            convo: chat.bsky.convo.defs.ConvoView,
          ) => chat.bsky.convo.defs.ConvoView,
        ) {
          queryClient.setQueriesData<ConvoListQueryData>(
            {queryKey: [RQKEY_ROOT]},
            old => optimisticUpdate(convoId, old, fn),
          )
          queryClient.setQueriesData<ConvoRequestListQueryData>(
            {queryKey: [REQUESTS_RQKEY_ROOT]},
            old => optimisticUpdateRequest(convoId, old, fn),
          )
        }

        function mutateConvoView(
          convoId: string,
          fn: (
            convo: chat.bsky.convo.defs.ConvoView,
          ) => chat.bsky.convo.defs.ConvoView,
        ) {
          queryClient.setQueryData<chat.bsky.convo.defs.ConvoView>(
            CONVO_KEY(convoId),
            old => (old ? fn(old) : old),
          )
          updateConvoInAllLists(convoId, fn)
        }

        function deleteConvoFromAllLists(convoId: string) {
          queryClient.setQueriesData<ConvoListQueryData>(
            {queryKey: [RQKEY_ROOT]},
            old => optimisticDelete(convoId, old),
          )
          queryClient.setQueriesData<ConvoRequestListQueryData>(
            {queryKey: [REQUESTS_RQKEY_ROOT]},
            old => optimisticDeleteRequest(convoId, old),
          )
        }

        function handleMemberAdded(
          convoId: string,
          did: string,
          relatedProfiles: chat.bsky.actor.defs.ProfileViewBasic[],
          rev: string,
        ) {
          const newMember = relatedProfiles.find(r => r.did === did)
          if (!newMember) return
          // If the optimistic add already added them, skip the
          // memberCount bump to avoid double-counting.
          const alreadyKnownMember =
            queryClient
              .getQueryData<
                chat.bsky.actor.defs.ProfileViewBasic[]
              >(listConvoMembersQueryKey(convoId))
              ?.some(m => m.did === did) ?? false
          mutateMembers(convoId, list =>
            list.some(m => m.did === did) ? list : list.concat(newMember),
          )
          mutateConvoView(
            convoId,
            withRevGuard(rev, convo =>
              addMemberToConvoView(convo, newMember, rev, alreadyKnownMember),
            ),
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
                chat.bsky.actor.defs.ProfileViewBasic[]
              >(listConvoMembersQueryKey(convoId))
              ?.some(m => m.did === did) === false
          mutateMembers(convoId, list => list.filter(m => m.did !== did))
          mutateConvoView(
            convoId,
            withRevGuard(rev, convo =>
              removeMemberFromConvoView(convo, did, rev, alreadyRemovedMember),
            ),
          )
        }

        for (const log of events.logs) {
          if (bsky.isType(chat.bsky.convo.defs.logBeginConvo, log)) {
            debouncedRefetch()
          } else if (bsky.isType(chat.bsky.convo.defs.logLeaveConvo, log)) {
            deleteConvoFromAllLists(log.convoId)
            // The viewer is no longer in this convo (they left on another
            // device, or were removed - removed members receive a
            // logLeaveConvo, not a logRemoveMember). Refetch any cached join
            // link preview so its viewer state reflects the lost membership.
            void invalidateJoinLinkPreviewsForConvo(queryClient, log.convoId)
          } else if (bsky.isType(chat.bsky.convo.defs.logDeleteMessage, log)) {
            updateConvoInAllLists(
              log.convoId,
              withRevGuard(log.rev, convo => {
                if (
                  (bsky.isType(
                    chat.bsky.convo.defs.deletedMessageView,
                    log.message,
                  ) ||
                    bsky.isType(
                      chat.bsky.convo.defs.messageView,
                      log.message,
                    )) &&
                  (bsky.isType(
                    chat.bsky.convo.defs.deletedMessageView,
                    convo.lastMessage,
                  ) ||
                    bsky.isType(
                      chat.bsky.convo.defs.messageView,
                      convo.lastMessage,
                    ))
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
          } else if (bsky.isType(chat.bsky.convo.defs.logCreateMessage, log)) {
            // Store in a new var to avoid TS errors due to closures.
            const logRef: chat.bsky.convo.defs.LogCreateMessage = log

            // Get all matching queries
            const queries = queryClient.getQueriesData<ConvoListQueryData>({
              queryKey: [RQKEY_ROOT],
            })

            // Check if convo exists in any query
            let foundConvo: chat.bsky.convo.defs.ConvoView | null = null
            for (const [_key, query] of queries) {
              if (!query) continue
              const convo = getConvoFromQueryData(logRef.convoId, query)
              if (convo) {
                foundConvo = convo
                break
              }
            }

            if (!foundConvo) {
              // Convo not found, trigger refetch. Use continue (not return) so
              // the remaining logs in this batch still apply - the bus advances
              // its cursor past this batch, so a dropped log is never
              // redelivered.
              debouncedRefetch()
              continue
            }

            // Rev guard. updatedConvo is built once from foundConvo and applied
            // across caches, so guarding here (rather than per-cache) is both
            // simplest and correct - skip if the log isn't newer than the
            // cached convo.
            if (logRef.rev <= foundConvo.rev) {
              continue
            }

            // add relatedProfiles to members list, but making sure to dedupe
            const relatedProfilesSansMembers = (
              logRef.relatedProfiles ?? []
            ).filter(
              profile =>
                !foundConvo.members.some(member => member.did === profile.did),
            )

            // Update the convo
            const updatedConvo = {
              ...foundConvo,
              members: [...foundConvo.members, ...relatedProfilesSansMembers],
              rev: logRef.rev,
              lastMessage: logRef.message,
              unreadCount:
                foundConvo.id !== currentConvoId
                  ? (bsky.isType(
                      chat.bsky.convo.defs.messageView,
                      logRef.message,
                    ) ||
                      bsky.isType(
                        chat.bsky.convo.defs.deletedMessageView,
                        logRef.message,
                      )) &&
                    logRef.message.sender.did !== currentAccount?.did
                    ? foundConvo.unreadCount + 1
                    : foundConvo.unreadCount
                  : 0,
            }

            function filterConvoFromPage(
              convo: chat.bsky.convo.defs.ConvoView[],
            ) {
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
            // always update the unread ones, where the convo qualifies
            queryClient.setQueriesData(
              {
                queryKey: RQKEY_PARTIAL('all', 'unread'),
                predicate: convoListQueryPredicate(updatedConvo),
              },
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
                {
                  queryKey: RQKEY_PARTIAL('accepted'),
                  predicate: convoListQueryPredicate(updatedConvo),
                },
                updateFn,
              )
            } else if (updatedConvo.status === 'request') {
              queryClient.setQueriesData(
                {
                  queryKey: RQKEY_PARTIAL('request'),
                  predicate: convoListQueryPredicate(updatedConvo),
                },
                updateFn,
              )
              // also move-to-top in the new requests cache
              queryClient.setQueriesData<ConvoRequestListQueryData>(
                {queryKey: [REQUESTS_RQKEY_ROOT]},
                old => moveConvoToTopInRequests(updatedConvo, old),
              )
            }
          } else if (bsky.isType(chat.bsky.convo.defs.logReadMessage, log)) {
            updateConvoInAllLists(
              log.convoId,
              withRevGuard(log.rev, convo => ({
                ...convo,
                unreadCount: 0,
                rev: log.rev,
              })),
            )
          } else if (bsky.isType(chat.bsky.convo.defs.logReadConvo, log)) {
            updateConvoInAllLists(
              log.convoId,
              withRevGuard(log.rev, convo => ({
                ...convo,
                unreadCount: 0,
                rev: log.rev,
              })),
            )
          } else if (bsky.isType(chat.bsky.convo.defs.logAcceptConvo, log)) {
            const requestQueries =
              queryClient.getQueriesData<ConvoListQueryData>({
                queryKey: RQKEY_PARTIAL('request'),
              })
            let foundConvo: chat.bsky.convo.defs.ConvoView | null = null
            for (const [_key, data] of requestQueries) {
              if (!data) continue
              foundConvo = getConvoFromQueryData(log.convoId, data)
              if (foundConvo) break
            }
            if (!foundConvo) {
              // Use continue (not return) so the remaining logs in this batch
              // still apply - the bus advances its cursor past this batch, so a
              // dropped log is never redelivered.
              debouncedRefetch()
              continue
            }
            if (log.rev <= foundConvo.rev) {
              continue
            }
            const acceptedConvo: chat.bsky.convo.defs.ConvoView = {
              ...foundConvo,
              status: 'accepted',
              rev: log.rev,
            }
            // Flip status to 'accepted' in every cache that already holds this
            // convo - including 'all'-status caches like the provider's
            // always-mounted unread query, which the request->accepted move
            // below otherwise never touches. Without this the stale 'all' copy
            // keeps status: 'request', and the next isLogCreateMessage can seed
            // foundConvo from it and resurrect the convo in the requests inbox.
            // Runs before the delete-from-request below: it updates in place
            // (never inserts), so the 'request' caches get the accepted copy and
            // are then cleared by the delete, leaving no stale request entries.
            updateConvoInAllLists(
              log.convoId,
              withRevGuard(log.rev, convo => ({
                ...convo,
                status: 'accepted',
                rev: log.rev,
              })),
            )
            queryClient.setQueriesData(
              {queryKey: RQKEY_PARTIAL('request')},
              (old?: ConvoListQueryData) => optimisticDelete(log.convoId, old),
            )
            // also remove from the new requests cache
            queryClient.setQueriesData<ConvoRequestListQueryData>(
              {queryKey: [REQUESTS_RQKEY_ROOT]},
              old => optimisticDeleteRequest(log.convoId, old),
            )
            queryClient.setQueriesData(
              {
                queryKey: RQKEY_PARTIAL('accepted'),
                predicate: convoListQueryPredicate(acceptedConvo),
              },
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
                          acceptedConvo,
                          ...page.convos.filter(c => c.id !== log.convoId),
                        ],
                      }
                    }
                    return {
                      ...page,
                      convos: page.convos.filter(c => c.id !== log.convoId),
                    }
                  }),
                }
              },
            )
          } else if (bsky.isType(chat.bsky.convo.defs.logMuteConvo, log)) {
            mutateConvoView(
              log.convoId,
              withRevGuard(log.rev, convo => ({
                ...convo,
                muted: true,
                rev: log.rev,
              })),
            )
          } else if (bsky.isType(chat.bsky.convo.defs.logUnmuteConvo, log)) {
            mutateConvoView(
              log.convoId,
              withRevGuard(log.rev, convo => ({
                ...convo,
                muted: false,
                rev: log.rev,
              })),
            )
          } else if (bsky.isType(chat.bsky.convo.defs.logLockConvo, log)) {
            mutateConvoView(
              log.convoId,
              withRevGuard(log.rev, convo => {
                if (bsky.isType(chat.bsky.convo.defs.groupConvo, convo.kind)) {
                  return {
                    ...convo,
                    kind: {...convo.kind, lockStatus: 'locked'},
                    rev: log.rev,
                  }
                }
                return {...convo, rev: log.rev}
              }),
            )
            // The log event doesn't say whether the lock is forced by a
            // moderation override, so refetch to pick up the flag.
            void queryClient.invalidateQueries({
              queryKey: CONVO_KEY(log.convoId),
            })
          } else if (bsky.isType(chat.bsky.convo.defs.logUnlockConvo, log)) {
            mutateConvoView(
              log.convoId,
              withRevGuard(log.rev, convo => {
                if (bsky.isType(chat.bsky.convo.defs.groupConvo, convo.kind)) {
                  return {
                    ...convo,
                    kind: {
                      ...convo.kind,
                      lockStatus: 'unlocked',
                      // An unlocked convo cannot be moderation-locked.
                      lockStatusModerationOverride: false,
                    },
                    rev: log.rev,
                  }
                }
                return {...convo, rev: log.rev}
              }),
            )
          } else if (
            bsky.isType(chat.bsky.convo.defs.logLockConvoPermanently, log)
          ) {
            mutateConvoView(
              log.convoId,
              withRevGuard(log.rev, convo => {
                if (bsky.isType(chat.bsky.convo.defs.groupConvo, convo.kind)) {
                  return {
                    ...convo,
                    kind: {...convo.kind, lockStatus: 'locked-permanently'},
                    rev: log.rev,
                  }
                }
                return {...convo, rev: log.rev}
              }),
            )
          } else if (
            bsky.isType(chat.bsky.convo.defs.logCreateJoinLink, log) ||
            bsky.isType(chat.bsky.convo.defs.logEditJoinLink, log) ||
            bsky.isType(chat.bsky.convo.defs.logEnableJoinLink, log) ||
            bsky.isType(chat.bsky.convo.defs.logDisableJoinLink, log)
          ) {
            // Join link data not included in the log event, trigger refetch to get it
            debouncedRefetch()
          } else if (bsky.isType(chat.bsky.convo.defs.logEditGroup, log)) {
            // Updated group details (name etc.) aren't included in the log
            // event, so refetch to pick them up.
            debouncedRefetch()
          } else if (
            bsky.isType(chat.bsky.convo.defs.logApproveJoinRequest, log) ||
            bsky.isType(chat.bsky.convo.defs.logRejectJoinRequest, log)
          ) {
            // Route through mutateConvoView (not updateConvoInAllLists) so the
            // single-convo cache updates too, keeping the in-convo requests
            // banner in sync.
            mutateConvoView(
              log.convoId,
              withRevGuard(log.rev, convo =>
                applyJoinRequestCountDelta(convo, log.rev, -1),
              ),
            )
          } else if (
            bsky.isType(chat.bsky.convo.defs.logIncomingJoinRequest, log)
          ) {
            // Route through mutateConvoView (not updateConvoInAllLists) so the
            // single-convo cache updates too, letting the in-convo requests
            // banner appear live.
            mutateConvoView(
              log.convoId,
              withRevGuard(log.rev, convo =>
                applyJoinRequestCountDelta(convo, log.rev, 1),
              ),
            )
          } else if (
            bsky.isType(chat.bsky.convo.defs.logReadJoinRequests, log)
          ) {
            // The owner marked join requests as read (possibly on another
            // device). Zero the unread count but keep the total, mirroring the
            // useMarkJoinRequestsRead mutation.
            mutateConvoView(
              log.convoId,
              withRevGuard(log.rev, convo => {
                if (!bsky.isType(chat.bsky.convo.defs.groupConvo, convo.kind)) {
                  return {...convo, rev: log.rev}
                }
                return {
                  ...convo,
                  kind: {...convo.kind, unreadJoinRequestCount: 0},
                  rev: log.rev,
                }
              }),
            )
          } else if (
            bsky.isType(chat.bsky.convo.defs.logOutgoingJoinRequest, log)
          ) {
            // Viewer isn't in the chat yet, but the inbox surfaces outgoing
            // requests, so refetch to pick up the new entry.
            debouncedRefetch()
          } else if (
            bsky.isType(
              chat.bsky.convo.defs.logWithdrawIncomingJoinRequest,
              log,
            )
          ) {
            // A requester rescinded their request to a group the viewer owns.
            // Mirror of isLogIncomingJoinRequest: decrement the counts.
            mutateConvoView(
              log.convoId,
              withRevGuard(log.rev, convo =>
                applyJoinRequestCountDelta(convo, log.rev, -1),
              ),
            )
          } else if (
            bsky.isType(
              chat.bsky.convo.defs.logWithdrawOutgoingJoinRequest,
              log,
            )
          ) {
            // The viewer rescinded their own outgoing join request (possibly on
            // another device). Remove it from the requests inbox cache.
            queryClient.setQueriesData<ConvoRequestListQueryData>(
              {queryKey: [REQUESTS_RQKEY_ROOT]},
              old => optimisticDeleteJoinRequest(log.convoId, old),
            )
          } else if (bsky.isType(chat.bsky.convo.defs.logAddReaction, log)) {
            updateConvoInAllLists(
              log.convoId,
              withRevGuard(log.rev, convo => {
                // add relatedProfiles to members list, but making sure to dedupe
                const relatedProfilesSansMembers = (
                  log.relatedProfiles ?? []
                ).filter(
                  profile =>
                    !convo.members.some(member => member.did === profile.did),
                )
                return {
                  ...convo,
                  members: [...convo.members, ...relatedProfilesSansMembers],
                  /*
                   * `log.message` can also be a deleted-message view per the
                   * log union, which the strict MessageAndReactionView type
                   * rejects - the raw ConvoView cache type only admits a live
                   * MessageView here. Keep the pre-migration runtime behavior
                   * (always store the view we got) and assert into the cache
                   * type; the runtime value is unchanged.
                   */
                  lastReaction: {
                    $type: 'chat.bsky.convo.defs#messageAndReactionView',
                    reaction: log.reaction,
                    message: log.message,
                  } as NonNullable<
                    chat.bsky.convo.defs.ConvoView['lastReaction']
                  >,
                  rev: log.rev,
                }
              }),
            )
          } else if (bsky.isType(chat.bsky.convo.defs.logAddMember, log)) {
            const data = log.message.data
            if (
              bsky.isType(chat.bsky.convo.defs.systemMessageDataAddMember, data)
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
          } else if (bsky.isType(chat.bsky.convo.defs.logRemoveMember, log)) {
            const data = log.message.data
            if (
              bsky.isType(
                chat.bsky.convo.defs.systemMessageDataRemoveMember,
                data,
              )
            ) {
              handleMemberRemoved(log.convoId, data.member.did, log.rev)
            }
            // Refetch so the server can refill the curated members list.
            void queryClient.invalidateQueries({
              queryKey: CONVO_KEY(log.convoId),
            })
            debouncedRefetch()
          } else if (bsky.isType(chat.bsky.convo.defs.logMemberJoin, log)) {
            const data = log.message.data
            if (
              bsky.isType(
                chat.bsky.convo.defs.systemMessageDataMemberJoin,
                data,
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
          } else if (bsky.isType(chat.bsky.convo.defs.logMemberLeave, log)) {
            const data = log.message.data
            if (
              bsky.isType(
                chat.bsky.convo.defs.systemMessageDataMemberLeave,
                data,
              )
            ) {
              handleMemberRemoved(log.convoId, data.member.did, log.rev)
            }
            void queryClient.invalidateQueries({
              queryKey: CONVO_KEY(log.convoId),
            })
            debouncedRefetch()
          } else if (bsky.isType(chat.bsky.convo.defs.logRemoveReaction, log)) {
            queryClient.setQueriesData(
              {queryKey: [RQKEY_ROOT]},
              (old?: ConvoListQueryData) =>
                optimisticUpdate(
                  log.convoId,
                  old,
                  withRevGuard(log.rev, convo => {
                    if (
                      // if the convo is the same
                      log.convoId === convo.id &&
                      bsky.isType(
                        chat.bsky.convo.defs.messageAndReactionView,
                        convo.lastReaction,
                      ) &&
                      bsky.isType(
                        chat.bsky.convo.defs.messageView,
                        log.message,
                      ) &&
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
                ),
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
    debouncedInvalidateUnreadCounts,
  ])

  return <>{children}</>
}

export function useUnreadMessageCount(): {
  count: number
  numUnread?: string
  hasNew: boolean
} {
  const {data} = useUnreadCountsQuery()
  const accepted = data?.unreadAcceptedConvos ?? 0
  const request = data?.unreadRequestConvos ?? 0

  if (accepted > 0) {
    return {
      count: accepted,
      // accepted is sentinel-capped at UNREAD_ACCEPTED_CAP (meaning "more than
      // cap - 1"). show the "+" overflow label only when accepted is actually
      // capped, otherwise clamp the number to cap - 1 so we never surface the
      // sentinel value (100) itself
      numUnread:
        accepted >= UNREAD_ACCEPTED_CAP
          ? `${UNREAD_ACCEPTED_CAP - 1}+`
          : String(Math.min(accepted, UNREAD_ACCEPTED_CAP - 1)),
      // only needed when numUnread is undefined
      hasNew: false,
    }
  } else if (request > 0) {
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
}

export type ConvoListQueryData = {
  pageParams: Array<string | undefined>
  pages: Array<chat.bsky.convo.listConvos.$OutputBody>
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

/**
 * Wraps a log-driven convo update so it's skipped when the log is not newer
 * than the cached convo. Lists are fed by two unsynchronized channels (full
 * listConvos refetches and the log stream), so a stale refetch snapshot can be
 * written after a log already applied, or a refetch can already include a
 * message whose log then arrives and double-counts. Rev comparison as plain
 * string comparison is safe here - revs are fixed-width. ConvoView.rev is a
 * required field per the lexicon, so convo.rev always exists.
 *
 * Only used in the log-event paths (which have a log.rev), never in the generic
 * optimisticUpdate helper, which mutations without a rev also call.
 */
function withRevGuard(
  rev: string,
  fn: (convo: chat.bsky.convo.defs.ConvoView) => chat.bsky.convo.defs.ConvoView,
): (convo: chat.bsky.convo.defs.ConvoView) => chat.bsky.convo.defs.ConvoView {
  return convo => (rev <= convo.rev ? convo : fn(convo))
}

function optimisticUpdate(
  chatId: string,
  old?: ConvoListQueryData,
  updateFn?: (
    convo: chat.bsky.convo.defs.ConvoView,
  ) => chat.bsky.convo.defs.ConvoView,
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

function applyJoinRequestCountDelta(
  convo: chat.bsky.convo.defs.ConvoView,
  rev: string,
  delta: 1 | -1,
): chat.bsky.convo.defs.ConvoView {
  // Join requests are only meaningful for group convos.
  if (!bsky.isType(chat.bsky.convo.defs.groupConvo, convo.kind)) {
    return {...convo, rev}
  }
  // Bump the total and unread counts together. Both are clamped at 0 and
  // collapse to undefined when empty, matching the server's shape.
  const bump = (current: number | undefined) => {
    const next = Math.max(0, (current ?? 0) + delta)
    return next === 0 ? undefined : next
  }
  return {
    ...convo,
    kind: {
      ...convo.kind,
      joinRequestCount: bump(convo.kind.joinRequestCount),
      unreadJoinRequestCount: bump(convo.kind.unreadJoinRequestCount),
    },
    rev,
  }
}

function moveConvoToTopInRequests(
  updatedConvo: chat.bsky.convo.defs.ConvoView,
  old: ConvoRequestListQueryData | undefined,
): ConvoRequestListQueryData | undefined {
  if (!old) return old
  const typedConvo: ConvoRequestListQueryData['pages'][number]['requests'][number] =
    {
      $type: 'chat.bsky.convo.defs#convoView',
      ...updatedConvo,
    }
  return {
    ...old,
    pages: old.pages.map((page, i) => {
      const filtered = page.requests.filter(
        item =>
          !bsky.isType(chat.bsky.convo.defs.convoView, item) ||
          item.id !== updatedConvo.id,
      )
      if (i === 0) {
        return {
          ...page,
          requests: [typedConvo, ...filtered],
        }
      }
      return {...page, requests: filtered}
    }),
  }
}

function removeMemberFromConvoView(
  convo: chat.bsky.convo.defs.ConvoView,
  did: string,
  rev: string,
  alreadyRemovedMember: boolean,
): chat.bsky.convo.defs.ConvoView {
  // Member add/remove/join/leave events are only meaningful for group convos.
  if (!bsky.isType(chat.bsky.convo.defs.groupConvo, convo.kind)) return convo
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
  convo: chat.bsky.convo.defs.ConvoView,
  member: chat.bsky.actor.defs.ProfileViewBasic,
  rev: string,
  alreadyKnownMember: boolean,
): chat.bsky.convo.defs.ConvoView {
  // Member add/remove/join/leave events are only meaningful for group convos.
  if (!bsky.isType(chat.bsky.convo.defs.groupConvo, convo.kind)) return convo
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
    InfiniteData<chat.bsky.convo.listConvos.$OutputBody>
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
