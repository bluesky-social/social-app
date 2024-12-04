import React, {useContext, useState, useSyncExternalStore} from 'react'
import {useFocusEffect} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {useAppState} from '#/lib/hooks/useAppState'
import {Convo} from '#/state/messages/convo/agent'
import {
  ConvoParams,
  ConvoState,
  ConvoStateBackgrounded,
  ConvoStateDisabled,
  ConvoStateReady,
  ConvoStateSuspended,
} from '#/state/messages/convo/types'
import {isConvoActive} from '#/state/messages/convo/util'
import {useMessagesEventBus} from '#/state/messages/events'
import {useMarkAsReadMutation} from '#/state/queries/messages/conversation'
import {RQKEY as ListConvosQueryKey} from '#/state/queries/messages/list-conversations'
import {RQKEY as createProfileQueryKey} from '#/state/queries/profile'
import {useAgent} from '#/state/session'

export * from '#/state/messages/convo/util'

const ChatContext = React.createContext<ConvoState | null>(null)

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
  const [convo] = useState(
    () =>
      new Convo({
        convoId,
        agent,
        events,
      }),
  )
  const service = useSyncExternalStore(convo.subscribe, convo.getSnapshot)
  const {mutate: markAsRead} = useMarkAsReadMutation()

  const appState = useAppState()
  const isActive = appState === 'active'
  useFocusEffect(
    React.useCallback(() => {
      if (isActive) {
        convo.resume()
        markAsRead({convoId})

        return () => {
          convo.background()
          markAsRead({convoId})
        }
      }
    }, [isActive, convo, convoId, markAsRead]),
  )

  React.useEffect(() => {
    return convo.on(event => {
      switch (event.type) {
        case 'invalidate-block-state': {
          for (const did of event.accountDids) {
            queryClient.invalidateQueries({
              queryKey: createProfileQueryKey(did),
            })
          }
          queryClient.invalidateQueries({
            queryKey: ListConvosQueryKey,
          })
        }
      }
    })
  }, [convo, queryClient])

  return <ChatContext.Provider value={service}>{children}</ChatContext.Provider>
}
