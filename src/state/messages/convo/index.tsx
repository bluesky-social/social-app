import React, {useContext, useState, useSyncExternalStore} from 'react'
import {AppState} from 'react-native'
import {useFocusEffect, useIsFocused} from '@react-navigation/native'

import {Convo} from '#/state/messages/convo/agent'
import {
  ConvoParams,
  ConvoState,
  ConvoStateBackgrounded,
  ConvoStateReady,
  ConvoStateSuspended,
} from '#/state/messages/convo/types'
import {isConvoActive} from '#/state/messages/convo/util'
import {useMessagesEventBus} from '#/state/messages/events'
import {useMarkAsReadMutation} from '#/state/queries/messages/conversation'
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
  const isScreenFocused = useIsFocused()
  const {getAgent} = useAgent()
  const events = useMessagesEventBus()
  const [convo] = useState(
    () =>
      new Convo({
        convoId,
        agent: getAgent(),
        events,
      }),
  )
  const service = useSyncExternalStore(convo.subscribe, convo.getSnapshot)
  const {mutate: markAsRead} = useMarkAsReadMutation()

  useFocusEffect(
    React.useCallback(() => {
      convo.resume()
      markAsRead({convoId})

      return () => {
        convo.background()
        markAsRead({convoId})
      }
    }, [convo, convoId, markAsRead]),
  )

  React.useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (isScreenFocused) {
        if (nextAppState === 'active') {
          convo.resume()
        } else {
          convo.background()
        }

        markAsRead({convoId})
      }
    }

    const sub = AppState.addEventListener('change', handleAppStateChange)

    return () => {
      sub.remove()
    }
  }, [convoId, convo, isScreenFocused, markAsRead])

  return <ChatContext.Provider value={service}>{children}</ChatContext.Provider>
}
