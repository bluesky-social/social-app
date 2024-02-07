import React from 'react'
import * as persisted from '#/state/persisted'

type StateContext = string
type SetContext = (v: string) => void

const stateContext = React.createContext<StateContext>('Following')
const setContext = React.createContext<SetContext>((_: string) => {})

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(
    () => persisted.get('lastSelectedHomeFeed') ?? 'home',
  )

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
