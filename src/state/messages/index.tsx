import React from 'react'

import {CurrentConvoIdProvider} from '#/state/messages/current-convo-id'
import {MessagesEventBusProvider} from '#/state/messages/events'

export function MessagesProvider({children}: {children: React.ReactNode}) {
  return (
    <CurrentConvoIdProvider>
      <MessagesEventBusProvider>{children}</MessagesEventBusProvider>
    </CurrentConvoIdProvider>
  )
}
