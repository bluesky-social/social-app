import React from 'react'

type StateContext = boolean
type ApiContext = (hasNew: boolean) => void

const stateContext = React.createContext<StateContext>(false)
const apiContext = React.createContext<ApiContext>((_: boolean) => {})

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(false)
  return (
    <stateContext.Provider value={state}>
      <apiContext.Provider value={setState}>{children}</apiContext.Provider>
    </stateContext.Provider>
  )
}

export function useHomeBadge() {
  return React.useContext(stateContext)
}

export function useSetHomeBadge() {
  return React.useContext(apiContext)
}
