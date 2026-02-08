import {useEffect, useState} from 'react'
import uuid from 'react-native-uuid'

import {onAppStateChange} from '#/lib/appState'
import {isSessionIdExpired} from '#/analytics/identifiers/util'

const SESSION_ID_KEY = 'bsky_session_id'
const LAST_EVENT_KEY = 'bsky_session_id_last_event_at'

let sessionId = (() => {
  const existing = window.sessionStorage.getItem(SESSION_ID_KEY)
  const lastEventStr = window.sessionStorage.getItem(LAST_EVENT_KEY)
  const lastEvent = lastEventStr ? Number(lastEventStr) : undefined
  const id = existing && !isSessionIdExpired(lastEvent) ? existing : uuid.v4()
  window.sessionStorage.setItem(SESSION_ID_KEY, id)
  window.sessionStorage.setItem(LAST_EVENT_KEY, String(Date.now()))
  return id
})()

export function getInitialSessionId() {
  return sessionId
}

export function useSessionId() {
  const [id, setId] = useState(() => sessionId)

  useEffect(() => {
    const sub = onAppStateChange(state => {
      if (state === 'active') {
        const lastEventStr = window.sessionStorage.getItem(LAST_EVENT_KEY)
        const lastEvent = lastEventStr ? Number(lastEventStr) : undefined
        if (isSessionIdExpired(lastEvent)) {
          sessionId = uuid.v4()
          window.sessionStorage.setItem(SESSION_ID_KEY, sessionId)
          setId(sessionId)
        }
      }
      window.sessionStorage.setItem(LAST_EVENT_KEY, String(Date.now()))
    })
    return () => sub.remove()
  }, [])

  return id
}
