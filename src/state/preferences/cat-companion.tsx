import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type CatCompanion = NonNullable<persisted.Schema['catCompanion']>

type SetContext = (next: Partial<CatCompanion>) => void

const stateContext = createContext<CatCompanion>(
  persisted.defaults.catCompanion!,
)
stateContext.displayName = 'CatCompanionStateContext'

const setContext = createContext<SetContext>((_: Partial<CatCompanion>) => {})
setContext.displayName = 'CatCompanionSetContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = useState<CatCompanion>(
    () => persisted.get('catCompanion') ?? persisted.defaults.catCompanion!,
  )

  const setStateWrapped = useCallback(
    (next: Partial<CatCompanion>) => {
      setState(prev => {
        const merged = {...prev, ...next}
        void persisted.write('catCompanion', merged)
        return merged
      })
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('catCompanion', next => {
      if (next) setState(next)
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

export function useCatCompanion() {
  return useContext(stateContext)
}

export function useSetCatCompanion() {
  return useContext(setContext)
}
