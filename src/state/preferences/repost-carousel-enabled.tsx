import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = boolean
type SetContext = (v: boolean) => void

const stateContext = React.createContext<StateContext>(
  Boolean(persisted.defaults.repostCarouselEnabled),
)
const setContext = React.createContext<SetContext>((_: boolean) => {})

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = React.useState(
    Boolean(persisted.get('repostCarouselEnabled')),
  )

  const setStateWrapped = React.useCallback(
    (value: persisted.Schema['repostCarouselEnabled']) => {
      setState(Boolean(value))
      persisted.write('repostCarouselEnabled', value)
    },
    [setState],
  )

  React.useEffect(() => {
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

export const useRepostCarouselEnabled = () => React.useContext(stateContext)
export const useSetRepostCarouselEnabled = () => React.useContext(setContext)
