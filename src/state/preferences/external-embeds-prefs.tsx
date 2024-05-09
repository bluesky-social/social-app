import React from 'react'

import * as persisted from '#/state/persisted'
import {EmbedPlayerSource} from 'lib/strings/embed-player'

type StateContext = persisted.Schema['externalEmbeds']
type SetContext = (
  source: EmbedPlayerSource,
  value: 'show' | 'hide' | undefined,
) => void

const stateContext = React.createContext<StateContext>(
  persisted.defaults.externalEmbeds,
)
const setContext = React.createContext<SetContext>({} as SetContext)

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(persisted.get('externalEmbeds'))

  const setStateWrapped = React.useCallback(
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

  React.useEffect(() => {
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
  return React.useContext(stateContext)
}

export function useSetExternalEmbedPref() {
  return React.useContext(setContext)
}
