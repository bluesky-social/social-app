import {createContext, useContext, useState} from 'react'
import {type PropsWithChildren} from 'react'

type StateContext = boolean
type SetContext = (v: boolean) => void

const stateContext = createContext<StateContext>(false)
stateContext.displayName = 'DrawerSwipeDisabledStateContext'
const setContext = createContext<SetContext>((_: boolean) => {})
setContext.displayName = 'DrawerSwipeDisabledSetContext'

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(false)
  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setState}>{children}</setContext.Provider>
    </stateContext.Provider>
  )
}

export function useIsDrawerSwipeDisabled() {
  return useContext(stateContext)
}

export function useSetDrawerSwipeDisabled() {
  return useContext(setContext)
}
