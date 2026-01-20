import uuid from 'react-native-uuid'

import {onAppStateChange} from '#/lib/appState'
import {updateBaseMetadata} from '#/logger/metadata'

const TTL = 30 * 60 * 1e3 // 30 min on web
const SESSION_ID_KEY = 'bsky_session_id'
const LAST_EVENT_KEY = 'bsky_session_id_last_event_at'

function expired(since: number | undefined) {
  if (since === undefined) return false
  return Date.now() - since >= TTL
}

let sessionId = (() => {
  const existing = window.sessionStorage.getItem(SESSION_ID_KEY)
  const lastEventStr = window.sessionStorage.getItem(LAST_EVENT_KEY)
  const lastEvent = lastEventStr ? Number(lastEventStr) : undefined
  const id = existing && !expired(lastEvent) ? existing : uuid.v4()
  window.sessionStorage.setItem(SESSION_ID_KEY, id)
  updateBaseMetadata({sessionId: id})
  return id
})()

onAppStateChange(state => {
  if (state === 'active') {
    const lastEventStr = window.sessionStorage.getItem(LAST_EVENT_KEY)
    const lastEvent = lastEventStr ? Number(lastEventStr) : undefined
    if (expired(lastEvent)) {
      sessionId = uuid.v4()
      window.sessionStorage.setItem(SESSION_ID_KEY, sessionId)
      updateBaseMetadata({sessionId})
    }
  } else {
    window.sessionStorage.setItem(LAST_EVENT_KEY, String(Date.now()))
  }
})

export function getSessionId() {
  return sessionId
}
