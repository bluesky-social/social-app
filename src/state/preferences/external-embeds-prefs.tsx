import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import {type EmbedPlayerSource} from '#/lib/strings/embed-player'
import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['externalEmbeds']
type SetContext = (
  source: EmbedPlayerSource,
  value: 'show' | 'hide' | undefined,
) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.externalEmbeds,
)
stateContext.displayName = 'ExternalEmbedsPrefsStateContext'
const setContext = createContext<SetContext>({} as SetContext)
setContext.displayName = 'ExternalEmbedsPrefsSetContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
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
    return persisted.onUpdate('externalEmbeds', nextExternalEmbeds => {
      setState(nextExternalEmbeds)
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
