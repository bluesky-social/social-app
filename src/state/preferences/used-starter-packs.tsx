import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = boolean | undefined
type SetContext = (v: boolean) => void

const stateContext = React.createContext<StateContext>(false)
const setContext = React.createContext<SetContext>((_: boolean) => {})

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = React.useState<StateContext>(() =>
    persisted.get('hasCheckedForStarterPack'),
  )

  const setStateWrapped = (v: boolean) => {
    setState(v)
    persisted.write('hasCheckedForStarterPack', v)
  }

  React.useEffect(() => {
    return persisted.onUpdate(
      'hasCheckedForStarterPack',
      nextHasCheckedForStarterPack => {
        setState(nextHasCheckedForStarterPack)
      },
    )
  }, [])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export const useHasCheckedForStarterPack = () => React.useContext(stateContext)
export const useSetHasCheckedForStarterPack = () => React.useContext(setContext)
