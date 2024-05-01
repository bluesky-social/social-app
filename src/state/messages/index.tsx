import React from 'react'
import {BskyAgent} from '@atproto-labs/api'

import {Convo, ConvoParams} from '#/state/messages/convo'
import {useAgent} from '#/state/session'
import {useDmServiceUrlStorage} from '#/screens/Messages/Temp/useDmServiceUrlStorage'

const ChatContext = React.createContext<{
  service: Convo
  state: Convo['state']
}>({
  // @ts-ignore
  service: null,
  // @ts-ignore
  state: null,
})

export function useChat() {
  return React.useContext(ChatContext)
}

export function ChatProvider({
  children,
  convoId,
}: Pick<ConvoParams, 'convoId'> & {children: React.ReactNode}) {
  const {serviceUrl} = useDmServiceUrlStorage()
  const {getAgent} = useAgent()
  const [service] = React.useState(
    () =>
      new Convo({
        convoId,
        agent: new BskyAgent({
          service: serviceUrl,
        }),
        __tempFromUserDid: getAgent().session?.did!,
      }),
  )
  const [state, setState] = React.useState(service.state)

  React.useEffect(() => {
    service.initialize()
  }, [service])

  React.useEffect(() => {
    const update = () => setState(service.state)
    service.on('update', update)
    return () => {
      service.destroy()
    }
  }, [service])

  return (
    <ChatContext.Provider value={{state, service}}>
      {children}
    </ChatContext.Provider>
  )
}
