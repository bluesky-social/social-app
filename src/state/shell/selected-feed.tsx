import React from 'react'
import * as persisted from '#/state/persisted'
import {isWeb} from '#/platform/detection'

type StateContext = string
type SetContext = (v: string) => void

const stateContext = React.createContext<StateContext>('Following')
const setContext = React.createContext<SetContext>((_: string) => {})

function getInitialFeed() {
  if (isWeb) {
    const params = new URLSearchParams(window.location.search)
    if (window.location.pathname === '/' && params.get('feed')) {
      const feed = params.get('feed')
      params.delete('feed')
      history.replaceState(null, '', '?' + params + location.hash)
      return feed
    }
  }
  return persisted.get('lastSelectedHomeFeed') ?? 'home'
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(getInitialFeed)

  const saveState = React.useCallback((feed: string) => {
    setState(feed)
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
