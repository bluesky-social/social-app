import React from 'react'

import {Gate} from '#/lib/statsig/gates'
import {useGate} from '#/lib/statsig/statsig'
import {isWeb} from '#/platform/detection'
import * as persisted from '#/state/persisted'

type StateContext = string
type SetContext = (v: string) => void

const stateContext = React.createContext<StateContext>('home')
const setContext = React.createContext<SetContext>((_: string) => {})

function getInitialFeed(gate: (gateName: Gate) => boolean) {
  if (isWeb) {
    if (window.location.pathname === '/') {
      const params = new URLSearchParams(window.location.search)
      const feedFromUrl = params.get('feed')
      if (feedFromUrl) {
        // If explicitly booted from a link like /?feed=..., prefer that.
        return feedFromUrl
      }
    }
    const feedFromSession = sessionStorage.getItem('lastSelectedHomeFeed')
    if (feedFromSession) {
      // Fall back to a previously chosen feed for this browser tab.
      return feedFromSession
    }
  }
  if (!gate('start_session_with_following_v2')) {
    const feedFromPersisted = persisted.get('lastSelectedHomeFeed')
    if (feedFromPersisted) {
      // Fall back to the last chosen one across all tabs.
      return feedFromPersisted
    }
  }
  return 'home'
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const gate = useGate()
  const [state, setState] = React.useState(() => getInitialFeed(gate))

  const saveState = React.useCallback((feed: string) => {
    setState(feed)
    if (isWeb) {
      try {
        sessionStorage.setItem('lastSelectedHomeFeed', feed)
      } catch {}
    }
    persisted.write('lastSelectedHomeFeed', feed)
  }, [])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={saveState}>{children}</setContext.Provider>
    </stateContext.Provider>
  )
}

export function useSelectedFeed() {
  return React.useContext(stateContext)
}

export function useSetSelectedFeed() {
  return React.useContext(setContext)
}
