import uuid from 'react-native-uuid'

import {onAppStateChange} from '#/lib/appState'
import {updateBaseMetadata} from '#/logger/metadata'
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
  updateBaseMetadata({sessionId: id})
  return id
})()

onAppStateChange(state => {
  if (state === 'active') {
    const lastEvent = device.get(['nativeSessionIdLastEventAt'])
    if (expired(lastEvent)) {
      sessionId = uuid.v4()
      device.set(['nativeSessionId'], sessionId)
      updateBaseMetadata({sessionId})
    }
  } else {
    device.set(['nativeSessionIdLastEventAt'], Date.now())
  }
})

export function getSessionId() {
  return sessionId
}
