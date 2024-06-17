import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext =
  | {
      uri: string
      cid?: string
      initialFeed?: string
      isClip?: boolean
    }
  | undefined
type SetContext = (v: StateContext) => void

const stateContext = React.createContext<StateContext>(undefined)
const setContext = React.createContext<SetContext>((_: StateContext) => {})

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = React.useState<StateContext>(() =>
    persisted.get('currentStarterPack'),
  )

  const setStateWrapped = (v: StateContext) => {
    setState(v)
    persisted.write('currentStarterPack', v)
  }

  React.useEffect(() => {
    return persisted.onUpdate(() => {
      setState(persisted.get('currentStarterPack'))
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

export const useCurrentStarterPack = () => React.useContext(stateContext)
export const useSetCurrentStarterPack = () => React.useContext(setContext)
