import uuid from 'react-native-uuid'

import {onAppStateChange} from '#/lib/appState'
import {device} from '#/storage'

const TTL = 5 * 60 * 1e3 // 5 min on native
function expired(since: number | undefined) {
  if (since === undefined) return false
  return Date.now() - since >= TTL
}

let sessionId = (() => {
  const existing = device.get(['nativeSessionId'])
  const lastEvent = device.get(['nativeSessionIdLastEventAt'])
  const id = existing && !expired(lastEvent) ? existing : uuid.v4()
  device.set(['nativeSessionId'], id)
  return id
})()

onAppStateChange(state => {
  if (state === 'active') {
    const lastEvent = device.get(['nativeSessionIdLastEventAt'])
    if (expired(lastEvent)) {
      sessionId = uuid.v4()
      device.set(['nativeSessionId'], sessionId)
    }
  } else {
    device.set(['nativeSessionIdLastEventAt'], Date.now())
  }
})

export function getSessionId() {
  return sessionId
}
