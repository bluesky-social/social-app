import {createContext, useContext, useState} from 'react'

type StateContext =
  | {
      uri: string
      isClip?: boolean
    }
  | undefined
type SetContext = (v: StateContext) => void

const stateContext = createContext<StateContext>(undefined)
stateContext.displayName = 'ActiveStarterPackStateContext'
const setContext = createContext<SetContext>((_: StateContext) => {})
setContext.displayName = 'ActiveStarterPackSetContext'

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = useState<StateContext>()

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setState}>{children}</setContext.Provider>
    </stateContext.Provider>
  )
}

export const useActiveStarterPack = () => useContext(stateContext)
export const useSetActiveStarterPack = () => useContext(setContext)
