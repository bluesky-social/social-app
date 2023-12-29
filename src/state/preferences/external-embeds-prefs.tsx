import React from 'react'
import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['externalEmbeds']
type SetContext = (
  source: keyof persisted.Schema['externalEmbeds'],
  value: 'ask' | 'show' | 'hide',
) => void
export type ExternalEmbedType = keyof persisted.Schema['externalEmbeds']
export const externalEmbedLabels: Record<ExternalEmbedType, string> = {
  youtube: 'YouTube',
  vimeo: 'Vimeo',
  twitch: 'Twitch',
  giphy: 'GIPHY',
  tenor: 'Tenor',
  spotify: 'Spotify',
  appleMusic: 'Apple Music',
  soundcloud: 'SoundCloud',
}

const stateContext = React.createContext<StateContext>(
  persisted.defaults.externalEmbeds,
)
const setContext = React.createContext<SetContext>({} as SetContext)

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(persisted.get('externalEmbeds'))

  const setStateWrapped = React.useCallback(
    (
      source: keyof persisted.Schema['externalEmbeds'],
      value: 'ask' | 'show' | 'hide',
    ) => {
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
