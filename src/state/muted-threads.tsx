import React from 'react'

import {track} from '#/lib/analytics/analytics'
import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['mutedThreads']
type ToggleContext = (uri: string) => boolean

const stateContext = React.createContext<StateContext>(
  persisted.defaults.mutedThreads,
)
const toggleContext = React.createContext<ToggleContext>((_: string) => false)

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(persisted.get('mutedThreads'))

  const toggleThreadMute = React.useCallback(
    (uri: string) => {
      let muted = false
      setState((arr: string[]) => {
        if (arr.includes(uri)) {
          arr = arr.filter(v => v !== uri)
          muted = false
          track('Post:ThreadUnmute')
        } else {
          arr = arr.concat([uri])
          muted = true
          track('Post:ThreadMute')
        }
        persisted.write('mutedThreads', arr)
        return arr
      })
      return muted
    },
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate(() => {
      setState(persisted.get('mutedThreads'))
    })
  }, [setState])

  return (
    <stateContext.Provider value={state}>
      <toggleContext.Provider value={toggleThreadMute}>
        {children}
      </toggleContext.Provider>
    </stateContext.Provider>
  )
}

export function useMutedThreads() {
  return React.useContext(stateContext)
}

export function useToggleThreadMute() {
  return React.useContext(toggleContext)
}

export function isThreadMuted(uri: string) {
  return persisted.get('mutedThreads').includes(uri)
}
