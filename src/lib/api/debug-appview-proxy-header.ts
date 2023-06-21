/**
 * APP-700
 *
 * This is a temporary debug setting we're running on the Web build to
 * help the protocol team test some changes.
 *
 * It should be removed in ~2 weeks. It should only be used on the Web
 * version of the app.
 */

import {useState, useCallback} from 'react'
import {BskyAgent} from '@atproto/api'
import {isWeb} from 'platform/detection'

export function useDebugHeaderSetting(agent: BskyAgent): [boolean, () => void] {
  const [enabled, setEnabled] = useState<boolean>(isEnabled())

  const toggle = useCallback(() => {
    if (!isWeb || typeof window === 'undefined') {
      return
    }
    if (!enabled) {
      localStorage.setItem('set-header-x-appview-proxy', 'yes')
      agent.api.xrpc.setHeader('x-appview-proxy', 'true')
      setEnabled(true)
    } else {
      localStorage.removeItem('set-header-x-appview-proxy')
      agent.api.xrpc.unsetHeader('x-appview-proxy')
      setEnabled(false)
    }
  }, [setEnabled, enabled, agent])

  return [enabled, toggle]
}

export function setDebugHeader(agent: BskyAgent, enabled: boolean) {
  if (!isWeb || typeof window === 'undefined') {
    return
  }
  if (enabled) {
    localStorage.setItem('set-header-x-appview-proxy', 'yes')
    agent.api.xrpc.setHeader('x-appview-proxy', 'true')
  } else {
    localStorage.removeItem('set-header-x-appview-proxy')
    agent.api.xrpc.unsetHeader('x-appview-proxy')
  }
}

export function applyDebugHeader(agent: BskyAgent) {
  if (!isWeb) {
    return
  }
  if (isEnabled()) {
    agent.api.xrpc.setHeader('x-appview-proxy', 'true')
  }
}

function isEnabled() {
  if (!isWeb || typeof window === 'undefined') {
    return false
  }
  return localStorage.getItem('set-header-x-appview-proxy') === 'yes'
}
