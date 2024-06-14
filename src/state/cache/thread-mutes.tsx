import React from 'react'

type StateContext = Record<string, boolean>
type SetStateContext = (uri: string, value: boolean) => void

const stateContext = React.createContext<StateContext>({})
const setStateContext = React.createContext<SetStateContext>(
  (_: string) => false,
)

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState<StateContext>({})

  const setThreadMute = React.useCallback(
    (uri: string, value: boolean) => {
      setState(prev => ({
        ...prev,
        [uri]: value,
      }))
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
  return state[uri] ?? defaultValue
}

export function useSetThreadMute() {
  return React.useContext(setStateContext)
}
