import {createContext, useCallback, useContext, useState} from 'react'

import {type FeedDescriptor} from '#/state/queries/post-feed'
import {useSession} from '#/state/session'
import {IS_WEB} from '#/env'
import {account} from '#/storage'

type StateContext = FeedDescriptor | null
type SetContext = (v: FeedDescriptor) => void

const stateContext = createContext<StateContext>(null)
stateContext.displayName = 'SelectedFeedStateContext'
const setContext = createContext<SetContext>((_: string) => {})
setContext.displayName = 'SelectedFeedSetContext'

function getInitialFeed(did?: string): FeedDescriptor | null {
  if (IS_WEB) {
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

  if (did) {
    const feedFromStorage = account.get([did, 'lastSelectedHomeFeed'])
    if (feedFromStorage) {
      // Fall back to the last chosen one across all tabs.
      return feedFromStorage as FeedDescriptor
    }
  }

  return null
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const {currentAccount} = useSession()
  const [state, setState] = useState(() => getInitialFeed(currentAccount?.did))

  const saveState = useCallback(
    (feed: FeedDescriptor) => {
      setState(feed)
      if (IS_WEB) {
        try {
          sessionStorage.setItem('lastSelectedHomeFeed', feed)
        } catch {}
      }
      if (currentAccount?.did) {
        account.set([currentAccount?.did, 'lastSelectedHomeFeed'], feed)
      }
    },
    [currentAccount?.did],
  )

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={saveState}>{children}</setContext.Provider>
    </stateContext.Provider>
  )
}

export function useSelectedFeed() {
  return useContext(stateContext)
}

export function useSetSelectedFeed() {
  return useContext(setContext)
}
