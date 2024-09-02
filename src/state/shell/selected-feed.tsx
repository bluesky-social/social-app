import React from 'react'

import {isWeb} from '#/platform/detection'
import * as persisted from '#/state/persisted'
import {FeedDescriptor} from '#/state/queries/post-feed'

type StateContext = FeedDescriptor | null
type SetContext = (v: FeedDescriptor) => void

const stateContext = React.createContext<StateContext>(null)
const setContext = React.createContext<SetContext>((_: string) => {})

function getInitialFeed(): FeedDescriptor | null {
  if (isWeb) {
    if (window.location.pathname === '/') {
      const params = new URLSearchParams(window.location.search)
      const feedFromUrl = params.get('feed')
      if (feedFromUrl) {
        // If explicitly booted from a link like /?feed=..., prefer that.
        return feedFromUrl as FeedDescriptor
      }
    }

    const feedFromSession = sessionStorage.getItem('lastSelectedHomeFeed')
    if (feedFromSession) {
      // Fall back to a previously chosen feed for this browser tab.
      return feedFromSession as FeedDescriptor
    }
  }

  const feedFromPersisted = persisted.get('lastSelectedHomeFeed')
  if (feedFromPersisted) {
    // Fall back to the last chosen one across all tabs.
    return feedFromPersisted as FeedDescriptor
  }

  return null
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(() => getInitialFeed())

  const saveState = React.useCallback((feed: FeedDescriptor) => {
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
