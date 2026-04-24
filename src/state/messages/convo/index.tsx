import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react'
import {useFocusEffect} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {useAppState} from '#/lib/appState'
import {Convo} from '#/state/messages/convo/agent'
import {
  ConvoDispatchEvent,
  ConvoErrorCode,
  type ConvoParams,
  type ConvoState,
  type ConvoStateBackgrounded,
  type ConvoStateDisabled,
  type ConvoStateReady,
  type ConvoStateSuspended,
} from '#/state/messages/convo/types'
import {isConvoActive} from '#/state/messages/convo/util'
import {useMessagesEventBus} from '#/state/messages/events'
import {
  useConvoQuery,
  useMarkAsReadMutation,
} from '#/state/queries/messages/conversation'
import {RQKEY_ROOT as ListConvosQueryKeyRoot} from '#/state/queries/messages/list-conversations'
import {useListConvoMembersQuery} from '#/state/queries/messages/list-convo-members'
import {RQKEY as createProfileQueryKey} from '#/state/queries/profile'
import {useAgent} from '#/state/session'

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
    | ConvoStateDisabled
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

  const {
    data: convoData,
    error: convoError,
    refetch: refetchConvo,
  } = useConvoQuery({convoId})
  const {
    data: membersData,
    error: membersError,
    refetch: refetchMembers,
  } = useListConvoMembersQuery({convoId})

  // eslint-disable-next-line react/hook-use-state
  const [convo] = useState(() => {
    return new Convo({
      convoId,
      agent,
      events,
      initialData: {convo: convoData, members: membersData},
    })
  })
  const service = useSyncExternalStore(convo.subscribe, convo.getSnapshot)
  const {mutate: markAsRead} = useMarkAsReadMutation()

  useEffect(() => {
    if (convoData && membersData) {
      convo.setConvoData(convoData, membersData)
    }
  }, [convo, convoData, membersData])

  useEffect(() => {
    if ((convoError || membersError) && !convo.convo) {
      convo.dispatch({
        event: ConvoDispatchEvent.Error,
        payload: {
          exception: (convoError || membersError) as Error,
          code: ConvoErrorCode.InitFailed,
          retry: () => {
            void refetchConvo()
            void refetchMembers()
          },
        },
      })
    }
  }, [convo, convoError, membersError, refetchConvo, refetchMembers])

  const appState = useAppState()
  const isActive = appState === 'active'
  useFocusEffect(
    useCallback(() => {
      if (isActive) {
        convo.resume()
        markAsRead({convoId})
        void refetchConvo()
        void refetchMembers()

        return () => {
          convo.background()
          markAsRead({convoId})
        }
      }
    }, [isActive, convo, convoId, markAsRead, refetchConvo, refetchMembers]),
  )

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
        }
      }
    })
  }, [convo, queryClient])

  return <ChatContext.Provider value={service}>{children}</ChatContext.Provider>
}
