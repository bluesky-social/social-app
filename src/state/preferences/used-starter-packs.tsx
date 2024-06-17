import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = string[] | undefined
type SetContext = (v: string) => void

const stateContext = React.createContext<StateContext>([])
const setContext = React.createContext<SetContext>((_: string) => {})

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = React.useState<StateContext>(() =>
    persisted.get('usedStarterPacks'),
  )

  const setStateWrapped = (v: string) => {
    persisted.write('usedStarterPacks', [...(state ? state : []), v])
    setState(prev => [...(prev ? prev : []), v])
  }

  React.useEffect(() => {
    return persisted.onUpdate(() => {
      setState(persisted.get('usedStarterPacks'))
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

export const useUsedStarterPacks = () => React.useContext(stateContext)
export const useAddUsedStarterPack = () => React.useContext(setContext)
