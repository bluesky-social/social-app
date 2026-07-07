import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = boolean
type SetContext = (v: boolean) => void

const stateContext = createContext<StateContext>(
  Boolean(persisted.defaults.blackskyOnlyDefault),
)
stateContext.displayName = 'BlackskyOnlyDefaultStateContext'
const setContext = createContext<SetContext>((_: boolean) => {})
setContext.displayName = 'BlackskyOnlyDefaultSetContext'

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = useState(
    Boolean(persisted.get('blackskyOnlyDefault')),
  )

  const setStateWrapped = useCallback((v: boolean) => {
    setState(v)
    persisted.write('blackskyOnlyDefault', v)
  }, [])

  useEffect(() => {
    return persisted.onUpdate('blackskyOnlyDefault', next => {
      setState(Boolean(next))
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

export const useBlackskyOnlyDefault = () => useContext(stateContext)
export const useSetBlackskyOnlyDefault = () => useContext(setContext)
