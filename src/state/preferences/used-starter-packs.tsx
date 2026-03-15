import {createContext, useContext, useEffect, useState} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = boolean | undefined
type SetContext = (v: boolean) => void

const stateContext = createContext<StateContext>(false)
stateContext.displayName = 'UsedStarterPacksStateContext'
const setContext = createContext<SetContext>((_: boolean) => {})
setContext.displayName = 'UsedStarterPacksSetContext'

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = useState<StateContext>(() =>
    persisted.get('hasCheckedForStarterPack'),
  )

  const setStateWrapped = (v: boolean) => {
    setState(v)
    persisted.write('hasCheckedForStarterPack', v)
  }

  useEffect(() => {
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

export const useHasCheckedForStarterPack = () => useContext(stateContext)
export const useSetHasCheckedForStarterPack = () => useContext(setContext)
