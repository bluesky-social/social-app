import React from 'react'

type StateContext = Map<string, boolean>
type SetStateContext = (uri: string, value: boolean) => void

const stateContext = React.createContext<StateContext>(new Map())
const setStateContext = React.createContext<SetStateContext>(
  (_: string) => false,
)

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState<StateContext>(() => new Map())

  const setThreadMute = React.useCallback(
    (uri: string, value: boolean) => {
      setState(prev => {
        const next = new Map(prev)
        next.set(uri, value)
        return next
      })
    },
    [setState],
  )
  return (
    <stateContext.Provider value={state}>
      <setStateContext.Provider value={setThreadMute}>
        {children}
      </setStateContext.Provider>
    </stateContext.Provider>
  )
}

export function useMutedThreads() {
  return React.useContext(stateContext)
}

export function useIsThreadMuted(uri: string, defaultValue = false) {
  const state = React.useContext(stateContext)
  return state.get(uri) ?? defaultValue
}

export function useSetThreadMute() {
  return React.useContext(setStateContext)
}
