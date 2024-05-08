import React, {useContext, useState, useSyncExternalStore} from 'react'
import {AppState} from 'react-native'
import {BskyAgent} from '@atproto-labs/api'
import {useFocusEffect, useIsFocused} from '@react-navigation/native'

import {Convo} from '#/state/messages/convo/agent'
import {ACTIVE_POLL_INTERVAL} from '#/state/messages/convo/const'
import {ConvoParams, ConvoState} from '#/state/messages/convo/types'
import {useMessagesEventBus} from '#/state/messages/events'
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
  const requestedPollInterval = React.useRef<(() => void) | void>()
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
  const events = useMessagesEventBus()

  React.useEffect(() => {
    const remove = events.trailConvo(convoId, events => {
      convo.ingestFirehose(events)
    })
    return () => {
      remove()
    }
  }, [convoId, convo, events])

  useFocusEffect(
    React.useCallback(() => {
      if (!requestedPollInterval.current) {
        requestedPollInterval.current =
          events.requestPollInterval(ACTIVE_POLL_INTERVAL)
      }

      convo.resume()
      markAsRead({convoId})

      return () => {
        if (requestedPollInterval.current) {
          requestedPollInterval.current = requestedPollInterval.current()
        }

        convo.background()
        markAsRead({convoId})
      }
    }, [convo, convoId, markAsRead, events]),
  )

  React.useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (isScreenFocused) {
        if (nextAppState === 'active') {
          convo.resume()

          if (!requestedPollInterval.current) {
            requestedPollInterval.current =
              events.requestPollInterval(ACTIVE_POLL_INTERVAL)
          }
        } else {
          convo.background()
          if (requestedPollInterval.current) {
            requestedPollInterval.current = requestedPollInterval.current()
          }
        }

        markAsRead({convoId})
      }
    }

    const sub = AppState.addEventListener('change', handleAppStateChange)

    return () => {
      sub.remove()
    }
  }, [convoId, convo, isScreenFocused, markAsRead, events])

  return <ChatContext.Provider value={service}>{children}</ChatContext.Provider>
}
