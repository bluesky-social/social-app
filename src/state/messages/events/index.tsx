import React from 'react'
import {AppState} from 'react-native'

import {MessagesEventBus} from '#/state/messages/events/agent'
import {useAgent, useSession} from '#/state/session'

const MessagesEventBusContext = React.createContext<MessagesEventBus | null>(
  null,
)

export function useMessagesEventBus() {
  const ctx = React.useContext(MessagesEventBusContext)
  if (!ctx) {
    throw new Error(
      'useMessagesEventBus must be used within a MessagesEventBusProvider',
    )
  }
  return ctx
}

export function MessagesEventBusProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const {currentAccount} = useSession()

  if (!currentAccount) {
    return (
      <MessagesEventBusContext.Provider value={null}>
        {children}
      </MessagesEventBusContext.Provider>
    )
  }

  return (
    <MessagesEventBusProviderInner>{children}</MessagesEventBusProviderInner>
  )
}

export function MessagesEventBusProviderInner({
  children,
}: {
  children: React.ReactNode
}) {
  const agent = useAgent()
  const [bus] = React.useState(
    () =>
      new MessagesEventBus({
        agent,
      }),
  )

  React.useEffect(() => {
    bus.resume()

    return () => {
      bus.suspend()
    }
  }, [bus])

  React.useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        bus.resume()
      } else {
        bus.background()
      }
    }

    const sub = AppState.addEventListener('change', handleAppStateChange)

    return () => {
      sub.remove()
    }
  }, [bus])

  return (
    <MessagesEventBusContext.Provider value={bus}>
      {children}
    </MessagesEventBusContext.Provider>
  )
}
