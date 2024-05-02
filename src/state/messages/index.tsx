import React, {useContext, useEffect, useMemo, useState} from 'react'
import {BskyAgent} from '@atproto-labs/api'

import {Convo, ConvoParams} from '#/state/messages/convo'
import {useAgent} from '#/state/session'
import {useDmServiceUrlStorage} from '#/screens/Messages/Temp/useDmServiceUrlStorage'

const ChatContext = React.createContext<{
  service: Convo
  state: Convo['state']
} | null>(null)

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
  const [service] = useState(
    () =>
      new Convo({
        convoId,
        agent: new BskyAgent({
          service: serviceUrl,
        }),
        __tempFromUserDid: getAgent().session?.did!,
      }),
  )
  const [state, setState] = useState(service.state)

  useEffect(() => {
    service.initialize()
  }, [service])

  useEffect(() => {
    const update = () => setState(service.state)
    service.on('update', update)
    return () => {
      service.destroy()
    }
  }, [service])

  const value = useMemo(() => ({service, state}), [service, state])

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}
