import React, {useContext, useState, useSyncExternalStore} from 'react'
import {AppState} from 'react-native'
import {BskyAgent} from '@atproto-labs/api'
import {useFocusEffect, useIsFocused} from '@react-navigation/native'

import {Convo} from '#/state/messages/convo/agent'
import {ConvoParams, ConvoState} from '#/state/messages/convo/types'
import {useMarkAsReadMutation} from '#/state/queries/messages/conversation'
import {useAgent} from '#/state/session'
import {useDmServiceUrlStorage} from '#/screens/Messages/Temp/useDmServiceUrlStorage'

const ChatContext = React.createContext<ConvoState | null>(null)

export function useConvo() {
  const ctx = useContext(ChatContext)
  if (!ctx) {
    throw new Error('useConvo must be used within a ConvoProvider')
  }
  return ctx
}

export function ConvoProvider({
  children,
  convoId,
}: Pick<ConvoParams, 'convoId'> & {children: React.ReactNode}) {
  const isScreenFocused = useIsFocused()
  const {serviceUrl} = useDmServiceUrlStorage()
  const {getAgent} = useAgent()
  const [convo] = useState(
    () =>
      new Convo({
        convoId,
        agent: new BskyAgent({
          service: serviceUrl,
        }),
        __tempFromUserDid: getAgent().session?.did!,
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
