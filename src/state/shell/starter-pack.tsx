import React from 'react'

type StateContext =
  | {
      uri: string
      isClip?: boolean
    }
  | undefined
type SetContext = (v: StateContext) => void

const stateContext = React.createContext<StateContext>(undefined)
const setContext = React.createContext<SetContext>((_: StateContext) => {})

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = React.useState<StateContext>()

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setState}>{children}</setContext.Provider>
    </stateContext.Provider>
  )
}

export const useActiveStarterPack = () => React.useContext(stateContext)
export const useSetActiveStarterPack = () => React.useContext(setContext)
