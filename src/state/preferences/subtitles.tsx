import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = boolean
type SetContext = (v: boolean) => void

const stateContext = createContext<StateContext>(
  Boolean(persisted.defaults.subtitlesEnabled),
)
stateContext.displayName = 'SubtitlesStateContext'
const setContext = createContext<SetContext>((_: boolean) => {})
setContext.displayName = 'SubtitlesSetContext'

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = useState(Boolean(persisted.get('subtitlesEnabled')))

  const setStateWrapped = useCallback(
    (subtitlesEnabled: persisted.Schema['subtitlesEnabled']) => {
      setState(Boolean(subtitlesEnabled))
      persisted.write('subtitlesEnabled', subtitlesEnabled)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('subtitlesEnabled', nextSubtitlesEnabled => {
      setState(Boolean(nextSubtitlesEnabled))
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

export const useSubtitlesEnabled = () => useContext(stateContext)
export const useSetSubtitlesEnabled = () => useContext(setContext)
