/**
 * APP-700
 *
 * This is a temporary debug setting we're running on the Web build to
 * help the protocol team test some changes.
 *
 * It should be removed in ~2 weeks. It should only be used on the Web
 * version of the app.
 */

import {useState, useCallback, useEffect} from 'react'
import {BskyAgent} from '@atproto/api'
import * as Storage from 'lib/storage'

export function useDebugHeaderSetting(agent: BskyAgent): [boolean, () => void] {
  const [enabled, setEnabled] = useState<boolean>(false)

  useEffect(() => {
    async function check() {
      if (await isEnabled()) {
        setEnabled(true)
      }
    }
    check()
  }, [])

  const toggle = useCallback(() => {
    if (!enabled) {
      Storage.saveString('set-header-x-appview-proxy', 'yes')
      agent.api.xrpc.setHeader('x-appview-proxy', 'true')
      setEnabled(true)
    } else {
      Storage.remove('set-header-x-appview-proxy')
      agent.api.xrpc.unsetHeader('x-appview-proxy')
      setEnabled(false)
    }
  }, [setEnabled, enabled, agent])

  return [enabled, toggle]
}

export function setDebugHeader(agent: BskyAgent, enabled: boolean) {
  if (enabled) {
    Storage.saveString('set-header-x-appview-proxy', 'yes')
    agent.api.xrpc.setHeader('x-appview-proxy', 'true')
  } else {
    Storage.remove('set-header-x-appview-proxy')
    agent.api.xrpc.unsetHeader('x-appview-proxy')
  }
}

export async function applyDebugHeader(agent: BskyAgent) {
  if (await isEnabled()) {
    agent.api.xrpc.setHeader('x-appview-proxy', 'true')
  }
}

async function isEnabled() {
  return (await Storage.loadString('set-header-x-appview-proxy')) === 'yes'
}
