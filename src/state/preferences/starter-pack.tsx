import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = string | undefined
type SetContext = (v: string) => void

const stateContext = React.createContext<StateContext>(undefined)
const setContext = React.createContext<SetContext>((_: string) => {})

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = React.useState<string>()

  const setStateWrapped = (v: string) => {
    setState(v)
    persisted.write('starterPackId', v)
  }

  React.useEffect(() => {
    return persisted.onUpdate(() => {
      setState(persisted.get('starterPackId'))
    })
  }, [])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export const useStarterPack = () => React.useContext(stateContext)
export const useSetStarterPack = () => React.useContext(setContext)
