import React, {useContext, useState, useSyncExternalStore} from 'react'
import {BskyAgent} from '@atproto-labs/api'
import {useFocusEffect} from '@react-navigation/native'

import {Convo, ConvoParams, ConvoState} from '#/state/messages/convo'
import {useAgent} from '#/state/session'
import {useDmServiceUrlStorage} from '#/screens/Messages/Temp/useDmServiceUrlStorage'

const ChatContext = React.createContext<ConvoState | null>(null)

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return ctx
}

export function ChatProvider({
  children,
  convoId,
}: Pick<ConvoParams, 'convoId'> & {children: React.ReactNode}) {
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

  useFocusEffect(
    React.useCallback(() => {
      convo.resume()

      return () => {
        convo.background()
      }
    }, [convo]),
  )

  return <ChatContext.Provider value={service}>{children}</ChatContext.Provider>
}
