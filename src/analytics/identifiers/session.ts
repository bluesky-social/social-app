import {useEffect, useState} from 'react'
import uuid from 'react-native-uuid'

import {onAppStateChange} from '#/lib/appState'
import {isSessionIdExpired} from '#/analytics/identifiers/util'
import {device} from '#/storage'

let sessionId = (() => {
  const existing = device.get(['nativeSessionId'])
  const lastEvent = device.get(['nativeSessionIdLastEventAt'])
  const id = existing && !isSessionIdExpired(lastEvent) ? existing : uuid.v4()
  device.set(['nativeSessionId'], id)
  device.set(['nativeSessionIdLastEventAt'], Date.now())
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
        const lastEvent = device.get(['nativeSessionIdLastEventAt'])
        if (isSessionIdExpired(lastEvent)) {
          sessionId = uuid.v4()
          device.set(['nativeSessionId'], sessionId)
          setId(sessionId)
        }
      }
      device.set(['nativeSessionIdLastEventAt'], Date.now())
    })
    return () => sub.remove()
  }, [])

  return id
}
