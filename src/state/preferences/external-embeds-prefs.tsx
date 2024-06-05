import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'
import {EmbedPlayerSource} from 'lib/strings/embed-player'

type StateContext = persisted.Schema['externalEmbeds']
type SetContext = (
  source: EmbedPlayerSource,
  value: 'show' | 'hide' | undefined,
) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.externalEmbeds,
)
const setContext = createContext<SetContext>({} as SetContext)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('externalEmbeds'))

  const setStateWrapped = useCallback(
    (source: EmbedPlayerSource, value: 'show' | 'hide' | undefined) => {
      setState(prev => {
        persisted.write('externalEmbeds', {
          ...prev,
          [source]: value,
        })

        return {
          ...prev,
          [source]: value,
        }
      })
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate(() => {
      setState(persisted.get('externalEmbeds'))
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

export function useExternalEmbedsPrefs() {
  return useContext(stateContext)
}

export function useSetExternalEmbedPref() {
  return useContext(setContext)
}
