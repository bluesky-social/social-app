import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'
import {type ChatBskyConvoDefs} from '@atproto/api'
import {useFocusEffect} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {useAppState} from '#/lib/appState'
import {Convo} from '#/state/messages/convo/agent'
import {
  type ConvoParams,
  type ConvoState,
  type ConvoStateBackgrounded,
  type ConvoStateReady,
  type ConvoStateSuspended,
} from '#/state/messages/convo/types'
import {isConvoActive} from '#/state/messages/convo/util'
import {useMessagesEventBus} from '#/state/messages/events'
import {
  RQKEY as getConvoKey,
  useMarkAsReadMutation,
} from '#/state/queries/messages/conversation'
import {RQKEY_ROOT as ListConvosQueryKeyRoot} from '#/state/queries/messages/list-conversations'
import {useListConvoMembersQuery} from '#/state/queries/messages/list-convo-members'
import {RQKEY as createProfileQueryKey} from '#/state/queries/profile'
import {useAgent, useSession} from '#/state/session'

export * from '#/state/messages/convo/util'

const ChatContext = createContext<ConvoState | null>(null)
ChatContext.displayName = 'ChatContext'

export function useConvo() {
  const ctx = useContext(ChatContext)
  if (!ctx) {
    throw new Error('useConvo must be used within a ConvoProvider')
  }
  return ctx
}

/**
 * This hook should only be used when the Convo is "active", meaning the chat
 * is loaded and ready to be used, or its in a suspended or background state,
 * and ready for resumption.
 */
export function useConvoActive() {
  const ctx = useContext(ChatContext) as
    | ConvoStateReady
    | ConvoStateBackgrounded
    | ConvoStateSuspended
  if (!ctx) {
    throw new Error('useConvo must be used within a ConvoProvider')
  }
  if (!isConvoActive(ctx)) {
    throw new Error(
      `useConvoActive must only be rendered when the Convo is ready.`,
    )
  }
  return ctx
}

export function ConvoProvider({
  children,
  convoId,
}: Pick<ConvoParams, 'convoId'> & {children: React.ReactNode}) {
  const queryClient = useQueryClient()
  const agent = useAgent()
  const events = useMessagesEventBus()
  const {currentAccount} = useSession()

  const getRecipientDids = useCallback(() => {
    const convo = queryClient.getQueryData<ChatBskyConvoDefs.ConvoView>(
      getConvoKey(convoId),
    )
    if (!convo) return []
    return convo.members
      .filter(m => m.did !== currentAccount?.did)
      .map(m => m.did)
  }, [queryClient, convoId, currentAccount?.did])

  const [convo] = useState(
    () =>
      new Convo({
        convoId,
        agent,
        events,
        getRecipientDids,
      }),
  )
  const service = useSyncExternalStore(convo.subscribe, convo.getSnapshot)
  const {mutate: markAsRead} = useMarkAsReadMutation()

  const appState = useAppState()
  const isActive = appState === 'active'
  useFocusEffect(
    useCallback(() => {
      if (isActive) {
        convo.resume()
        markAsRead({convoId})
        // agent no longer owns the convo — invalidate the RQ cache so the
        // header, member list, and status stay fresh after returning to
        // the screen.
        void queryClient.invalidateQueries({queryKey: getConvoKey(convoId)})

        return () => {
          convo.background()
          markAsRead({convoId})
        }
      }
    }, [isActive, convo, convoId, markAsRead, queryClient]),
  )

  // Push member-list data into the agent's `relatedProfiles` Map so that
  // messages render sender names even when the sender isn't returned in the
  // per-message `relatedProfiles` payload. The query hook is already
  // firehose-aware for add/remove-member events.
  const {data: memberList} = useListConvoMembersQuery({convoId})
  useEffect(() => {
    if (memberList) {
      convo.updateRelatedProfiles(memberList)
    }
  }, [memberList, convo])

  useEffect(() => {
    return convo.on(event => {
      switch (event.type) {
        case 'invalidate-block-state': {
          for (const did of event.accountDids) {
            void queryClient.invalidateQueries({
              queryKey: createProfileQueryKey(did),
            })
          }
          void queryClient.invalidateQueries({
            queryKey: [ListConvosQueryKeyRoot],
          })
          break
        }
        case 'account-disabled': {
          // Re-fetch the convo so the UI can surface the disabled state
          // via `chatDisabled` on the self member.
          void queryClient.invalidateQueries({
            queryKey: getConvoKey(convoId),
          })
          break
        }
      }
    })
  }, [convo, queryClient, convoId])

  // Auto-accept: when the user sends in a request-status convo, optimistically
  // flip the cached status to 'accepted' so UI updates immediately. The server
  // accepts on first send.
  const wrappedService = useMemo<ConvoState>(() => {
    if (!isConvoActive(service)) return service
    const originalSend = service.sendMessage
    return {
      ...service,
      sendMessage: message => {
        queryClient.setQueryData<ChatBskyConvoDefs.ConvoView>(
          getConvoKey(convoId),
          old => {
            if (!old || old.status !== 'request') return old
            return {...old, status: 'accepted'}
          },
        )
        originalSend(message)
      },
    }
  }, [service, queryClient, convoId])

  return (
    <ChatContext.Provider value={wrappedService}>
      {children}
    </ChatContext.Provider>
  )
}
