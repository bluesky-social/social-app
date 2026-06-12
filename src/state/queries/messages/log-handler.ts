import {type ChatBskyActorDefs, ChatBskyConvoDefs} from '@atproto/api'
import {type QueryClient} from '@tanstack/react-query'

import {type MessagesEventBusEvent} from '#/state/messages/events/types'
import {invalidateJoinLinkPreviewsForConvo} from '#/state/queries/join-links'
import * as bsky from '#/types/bsky'
import {RQKEY as CONVO_KEY} from './conversation'
import {
  type ConvoRequestListQueryData,
  optimisticDelete as optimisticDeleteRequest,
  optimisticDeleteJoinRequest,
  optimisticUpdate as optimisticUpdateRequest,
  RQKEY_ROOT as REQUESTS_RQKEY_ROOT,
} from './list-conversation-requests'
import {
  type ConvoListQueryData,
  convoListQueryPredicate,
  getConvoFromQueryData,
  optimisticDelete,
  optimisticUpdate,
  RQKEY_PARTIAL,
  RQKEY_ROOT,
} from './list-conversations'
import {listConvoMembersQueryKey} from './list-convo-members'

/**
 * Applies a batch of chat log events to the React Query caches (convo lists,
 * single-convo, members, requests). Exported as a pure function - separate
 * from the event-bus subscription in ListConvosProviderInner - so it can be
 * unit-tested directly without mounting the provider.
 */
export function handleConvoLogEvents({
  queryClient,
  logs,
  currentConvoId,
  currentAccountDid,
  onRefetchNeeded,
}: {
  queryClient: QueryClient
  logs: Extract<MessagesEventBusEvent, {type: 'logs'}>['logs']
  currentConvoId: string | undefined
  currentAccountDid: string | undefined
  onRefetchNeeded: () => void
}): void {
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

  function updateConvoInAllLists(
    convoId: string,
    fn: (convo: ChatBskyConvoDefs.ConvoView) => ChatBskyConvoDefs.ConvoView,
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
    fn: (convo: ChatBskyConvoDefs.ConvoView) => ChatBskyConvoDefs.ConvoView,
  ) {
    queryClient.setQueryData<ChatBskyConvoDefs.ConvoView>(
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
    mutateConvoView(
      convoId,
      withRevGuard(rev, convo =>
        addMemberToConvoView(convo, newMember, rev, alreadyKnownMember),
      ),
    )
  }

  function handleMemberRemoved(convoId: string, did: string, rev: string) {
    // If the optimistic remove already dropped them from the full
    // list, skip the memberCount decrement to avoid double-counting.
    const alreadyRemovedMember =
      queryClient
        .getQueryData<
          ChatBskyActorDefs.ProfileViewBasic[]
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

  for (const log of logs) {
    if (ChatBskyConvoDefs.isLogBeginConvo(log)) {
      onRefetchNeeded()
    } else if (ChatBskyConvoDefs.isLogLeaveConvo(log)) {
      deleteConvoFromAllLists(log.convoId)
      // The viewer is no longer in this convo (they left on another
      // device, or were removed - removed members receive a
      // logLeaveConvo, not a logRemoveMember). Refetch any cached join
      // link preview so its viewer state reflects the lost membership.
      void invalidateJoinLinkPreviewsForConvo(queryClient, log.convoId)
    } else if (ChatBskyConvoDefs.isLogDeleteMessage(log)) {
      updateConvoInAllLists(
        log.convoId,
        withRevGuard(log.rev, convo => {
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
        // Convo not found, trigger refetch. Use continue (not return) so
        // the remaining logs in this batch still apply - the bus advances
        // its cursor past this batch, so a dropped log is never
        // redelivered.
        onRefetchNeeded()
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
      const relatedProfilesSansMembers = (logRef.relatedProfiles ?? []).filter(
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
            ? (ChatBskyConvoDefs.isMessageView(logRef.message) ||
                ChatBskyConvoDefs.isDeletedMessageView(logRef.message)) &&
              logRef.message.sender.did !== currentAccountDid
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
                convos: [updatedConvo, ...filterConvoFromPage(page.convos)],
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
    } else if (ChatBskyConvoDefs.isLogReadMessage(log)) {
      updateConvoInAllLists(
        log.convoId,
        withRevGuard(log.rev, convo => ({
          ...convo,
          unreadCount: 0,
          rev: log.rev,
        })),
      )
    } else if (ChatBskyConvoDefs.isLogReadConvo(log)) {
      updateConvoInAllLists(
        log.convoId,
        withRevGuard(log.rev, convo => ({
          ...convo,
          unreadCount: 0,
          rev: log.rev,
        })),
      )
    } else if (ChatBskyConvoDefs.isLogAcceptConvo(log)) {
      const requestQueries = queryClient.getQueriesData<ConvoListQueryData>({
        queryKey: RQKEY_PARTIAL('request'),
      })
      let foundConvo: ChatBskyConvoDefs.ConvoView | null = null
      for (const [_key, data] of requestQueries) {
        if (!data) continue
        foundConvo = getConvoFromQueryData(log.convoId, data)
        if (foundConvo) break
      }
      if (!foundConvo) {
        // Use continue (not return) so the remaining logs in this batch
        // still apply - the bus advances its cursor past this batch, so a
        // dropped log is never redelivered.
        onRefetchNeeded()
        continue
      }
      if (log.rev <= foundConvo.rev) {
        continue
      }
      const acceptedConvo: ChatBskyConvoDefs.ConvoView = {
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
            onRefetchNeeded()
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
    } else if (ChatBskyConvoDefs.isLogMuteConvo(log)) {
      mutateConvoView(
        log.convoId,
        withRevGuard(log.rev, convo => ({
          ...convo,
          muted: true,
          rev: log.rev,
        })),
      )
    } else if (ChatBskyConvoDefs.isLogUnmuteConvo(log)) {
      mutateConvoView(
        log.convoId,
        withRevGuard(log.rev, convo => ({
          ...convo,
          muted: false,
          rev: log.rev,
        })),
      )
    } else if (ChatBskyConvoDefs.isLogLockConvo(log)) {
      mutateConvoView(
        log.convoId,
        withRevGuard(log.rev, convo => {
          if (ChatBskyConvoDefs.isGroupConvo(convo.kind)) {
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
    } else if (ChatBskyConvoDefs.isLogUnlockConvo(log)) {
      mutateConvoView(
        log.convoId,
        withRevGuard(log.rev, convo => {
          if (ChatBskyConvoDefs.isGroupConvo(convo.kind)) {
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
    } else if (ChatBskyConvoDefs.isLogLockConvoPermanently(log)) {
      mutateConvoView(
        log.convoId,
        withRevGuard(log.rev, convo => {
          if (ChatBskyConvoDefs.isGroupConvo(convo.kind)) {
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
      ChatBskyConvoDefs.isLogCreateJoinLink(log) ||
      ChatBskyConvoDefs.isLogEditJoinLink(log) ||
      ChatBskyConvoDefs.isLogEnableJoinLink(log) ||
      ChatBskyConvoDefs.isLogDisableJoinLink(log)
    ) {
      // Join link data not included in the log event, trigger refetch to get it
      onRefetchNeeded()
    } else if (ChatBskyConvoDefs.isLogEditGroup(log)) {
      // Updated group details (name etc.) aren't included in the log
      // event, so refetch to pick them up.
      onRefetchNeeded()
    } else if (
      ChatBskyConvoDefs.isLogApproveJoinRequest(log) ||
      ChatBskyConvoDefs.isLogRejectJoinRequest(log)
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
    } else if (ChatBskyConvoDefs.isLogIncomingJoinRequest(log)) {
      // Route through mutateConvoView (not updateConvoInAllLists) so the
      // single-convo cache updates too, letting the in-convo requests
      // banner appear live.
      mutateConvoView(
        log.convoId,
        withRevGuard(log.rev, convo =>
          applyJoinRequestCountDelta(convo, log.rev, 1),
        ),
      )
    } else if (ChatBskyConvoDefs.isLogReadJoinRequests(log)) {
      // The owner marked join requests as read (possibly on another
      // device). Zero the unread count but keep the total, mirroring the
      // useMarkJoinRequestsRead mutation.
      mutateConvoView(
        log.convoId,
        withRevGuard(log.rev, convo => {
          if (!ChatBskyConvoDefs.isGroupConvo(convo.kind)) {
            return {...convo, rev: log.rev}
          }
          return {
            ...convo,
            kind: {...convo.kind, unreadJoinRequestCount: 0},
            rev: log.rev,
          }
        }),
      )
    } else if (ChatBskyConvoDefs.isLogOutgoingJoinRequest(log)) {
      // Viewer isn't in the chat yet, but the inbox surfaces outgoing
      // requests, so refetch to pick up the new entry.
      onRefetchNeeded()
    } else if (ChatBskyConvoDefs.isLogWithdrawIncomingJoinRequest(log)) {
      // A requester rescinded their request to a group the viewer owns.
      // Mirror of isLogIncomingJoinRequest: decrement the counts.
      mutateConvoView(
        log.convoId,
        withRevGuard(log.rev, convo =>
          applyJoinRequestCountDelta(convo, log.rev, -1),
        ),
      )
    } else if (ChatBskyConvoDefs.isLogWithdrawOutgoingJoinRequest(log)) {
      // The viewer rescinded their own outgoing join request (possibly on
      // another device). Remove it from the requests inbox cache.
      queryClient.setQueriesData<ConvoRequestListQueryData>(
        {queryKey: [REQUESTS_RQKEY_ROOT]},
        old => optimisticDeleteJoinRequest(log.convoId, old),
      )
    } else if (ChatBskyConvoDefs.isLogAddReaction(log)) {
      updateConvoInAllLists(
        log.convoId,
        withRevGuard(log.rev, convo => {
          // add relatedProfiles to members list, but making sure to dedupe
          const relatedProfilesSansMembers = (log.relatedProfiles ?? []).filter(
            profile =>
              !convo.members.some(member => member.did === profile.did),
          )
          return {
            ...convo,
            members: [...convo.members, ...relatedProfilesSansMembers],
            lastReaction: {
              $type: 'chat.bsky.convo.defs#messageAndReactionView',
              reaction: log.reaction,
              message: log.message,
            },
            rev: log.rev,
          }
        }),
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
      onRefetchNeeded()
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
      onRefetchNeeded()
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
      onRefetchNeeded()
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
      onRefetchNeeded()
    } else if (ChatBskyConvoDefs.isLogRemoveReaction(log)) {
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
          ),
      )
    }
  }
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
  fn: (convo: ChatBskyConvoDefs.ConvoView) => ChatBskyConvoDefs.ConvoView,
): (convo: ChatBskyConvoDefs.ConvoView) => ChatBskyConvoDefs.ConvoView {
  return convo => (rev <= convo.rev ? convo : fn(convo))
}

function applyJoinRequestCountDelta(
  convo: ChatBskyConvoDefs.ConvoView,
  rev: string,
  delta: 1 | -1,
): ChatBskyConvoDefs.ConvoView {
  // Join requests are only meaningful for group convos.
  if (!ChatBskyConvoDefs.isGroupConvo(convo.kind)) {
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
  updatedConvo: ChatBskyConvoDefs.ConvoView,
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
          !ChatBskyConvoDefs.isConvoView(item) || item.id !== updatedConvo.id,
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
