import React from 'react'

import * as persisted from '#/state/persisted'
import {IS_WEB} from '#/env'

type StateContext = persisted.Schema['kawaii']

const stateContext = React.createContext<StateContext>(
  persisted.defaults.kawaii,
)
stateContext.displayName = 'KawaiiStateContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(persisted.get('kawaii'))

  const setStateWrapped = React.useCallback(
    (kawaii: persisted.Schema['kawaii']) => {
      setState(kawaii)
      persisted.write('kawaii', kawaii)
    },
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate('kawaii', nextKawaii => {
      setState(nextKawaii)
    })
  }, [setStateWrapped])

  React.useEffect(() => {
    // dumb and stupid but it's web only so just refresh the page if you want to change it

    if (IS_WEB) {
      const kawaii = new URLSearchParams(window.location.search).get('kawaii')
      switch (kawaii) {
        case 'true':
          setStateWrapped(true)
          break
        case 'false':
          setStateWrapped(false)
          break
      }
    }
  }, [setStateWrapped])

  return <stateContext.Provider value={state}>{children}</stateContext.Provider>
}

export function useKawaiiMode() {
  return React.useContext(stateContext)
}
