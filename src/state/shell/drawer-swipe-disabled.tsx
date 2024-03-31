import React from 'react'

type StateContext = boolean
type SetContext = (v: boolean) => void

const stateContext = React.createContext<StateContext>(false)
const setContext = React.createContext<SetContext>((_: boolean) => {})

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(false)
  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setState}>{children}</setContext.Provider>
    </stateContext.Provider>
  )
}

export function useIsDrawerSwipeDisabled() {
  return React.useContext(stateContext)
}

export function useSetDrawerSwipeDisabled() {
  return React.useContext(setContext)
}
