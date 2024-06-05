import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import {track} from '#/lib/analytics/analytics'
import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['mutedThreads']
type ToggleContext = (uri: string) => boolean

const stateContext = createContext<StateContext>(
  persisted.defaults.mutedThreads,
)
const toggleContext = createContext<ToggleContext>((_: string) => false)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('mutedThreads'))

  const toggleThreadMute = useCallback(
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

  useEffect(() => {
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
  return useContext(stateContext)
}

export function useToggleThreadMute() {
  return useContext(toggleContext)
}

export function isThreadMuted(uri: string) {
  return persisted.get('mutedThreads').includes(uri)
}
