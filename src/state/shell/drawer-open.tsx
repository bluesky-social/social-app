import React from 'react'

type StateContext = boolean
type SetContext = (v: boolean) => void

const stateContext = React.createContext<StateContext>(false)
stateContext.displayName = 'DrawerOpenStateContext'
const setContext = React.createContext<SetContext>((_: boolean) => {})
setContext.displayName = 'DrawerOpenSetContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(false)

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setState}>{children}</setContext.Provider>
    </stateContext.Provider>
  )
}

export function useIsDrawerOpen() {
  return React.useContext(stateContext)
}

export function useSetDrawerOpen() {
  return React.useContext(setContext)
}
