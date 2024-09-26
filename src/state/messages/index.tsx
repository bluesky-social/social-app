import React from 'react'

import {CurrentConvoIdProvider} from '#/state/messages/current-convo-id'
import {MessagesEventBusProvider} from '#/state/messages/events'
import {ListConvosProvider} from '#/state/queries/messages/list-converations'
import {MessageDraftsProvider} from './message-drafts'

export function MessagesProvider({children}: {children: React.ReactNode}) {
  return (
    <CurrentConvoIdProvider>
      <MessageDraftsProvider>
        <MessagesEventBusProvider>
          <ListConvosProvider>{children}</ListConvosProvider>
        </MessagesEventBusProvider>
      </MessageDraftsProvider>
    </CurrentConvoIdProvider>
  )
}
