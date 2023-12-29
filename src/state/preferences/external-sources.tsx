import React from 'react'
import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['externalSources']
type SetContext = (
  source: keyof persisted.Schema['externalSources'],
  value: 'ask' | 'always' | 'never' | 'unknown',
) => void
export type ExternalSourceType = keyof persisted.Schema['externalSources']

const stateContext = React.createContext<StateContext>(
  persisted.defaults.externalSources,
)
const setContext = React.createContext<SetContext>({} as SetContext)

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(persisted.get('externalSources'))

  const setStateWrapped = React.useCallback(
    (
      source: keyof persisted.Schema['externalSources'],
      value: 'ask' | 'always' | 'never' | 'unknown',
    ) => {
      setState(prev => {
        persisted.write('externalSources', {
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
      setState(persisted.get('externalSources'))
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

export function useExternalSources() {
  return React.useContext(stateContext)
}

export function useSetExternalSource() {
  return React.useContext(setContext)
}
