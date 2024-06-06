import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import {isWeb} from '#/platform/detection'
import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['kawaii']

const stateContext = createContext<StateContext>(persisted.defaults.kawaii)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('kawaii'))

  const setStateWrapped = useCallback(
    (kawaii: persisted.Schema['kawaii']) => {
      setState(kawaii)
      persisted.write('kawaii', kawaii)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate(() => {
      setState(persisted.get('kawaii'))
    })
  }, [setStateWrapped])

  useEffect(() => {
    // dumb and stupid but it's web only so just refresh the page if you want to change it

    if (isWeb) {
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
  return useContext(stateContext)
}
