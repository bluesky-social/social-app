import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext =
  | {
      uri: string
      cid?: string
      initialFeed?: string
      isClip?: boolean
      lastUsedUri?: string
    }
  | undefined
type SetContext = (v: StateContext) => void

const stateContext = React.createContext<StateContext>(undefined)
const setContext = React.createContext<SetContext>((_: StateContext) => {})

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = React.useState<StateContext>()

  const setStateWrapped = (v: StateContext) => {
    setState(v)
    persisted.write('usedStarterPack', v)
  }

  React.useEffect(() => {
    return persisted.onUpdate(() => {
      setState(persisted.get('usedStarterPack'))
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

export const useUsedStarterPack = () => React.useContext(stateContext)
export const useSetUsedStarterPack = () => React.useContext(setContext)
