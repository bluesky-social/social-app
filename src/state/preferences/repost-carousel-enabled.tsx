import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = boolean
type SetContext = (v: boolean) => void

const stateContext = createContext<StateContext>(
  Boolean(persisted.defaults.repostCarouselEnabled),
)
const setContext = createContext<SetContext>((_: boolean) => {})

export function Provider({children}: {children: ReactNode}) {
  const [state, setState] = useState(
    Boolean(persisted.get('repostCarouselEnabled')),
  )

  const setStateWrapped = useCallback(
    (value: persisted.Schema['repostCarouselEnabled']) => {
      setState(Boolean(value))
      persisted.write('repostCarouselEnabled', value)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('repostCarouselEnabled', nextValue => {
      setState(Boolean(nextValue))
    })
  }, [setStateWrapped])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export const useRepostCarouselEnabled = () => useContext(stateContext)
export const useSetRepostCarouselEnabled = () => useContext(setContext)
