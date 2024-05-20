import React from 'react'
import {AppState} from 'react-native'

import {useGate} from '#/lib/statsig/statsig'
import {isWeb} from '#/platform/detection'
import {MessagesEventBus} from '#/state/messages/events/agent'
import {useAgent} from '#/state/session'
import {IS_DEV} from '#/env'

const MessagesEventBusContext = React.createContext<MessagesEventBus | null>(
  null,
)

export function useMessagesEventBus() {
  const ctx = React.useContext(MessagesEventBusContext)
  if (!ctx) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return ctx
}

export function Temp_MessagesEventBusProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const {getAgent} = useAgent()
  const [bus] = React.useState(
    () =>
      new MessagesEventBus({
        agent: getAgent(),
      }),
  )

  React.useEffect(() => {
    if (isWeb && IS_DEV) {
      // @ts-ignore
      window.bus = bus
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

export function MessagesEventBusProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const gate = useGate()
  if (gate('dms')) {
    return (
      <Temp_MessagesEventBusProvider>{children}</Temp_MessagesEventBusProvider>
    )
  }
  return children
}
