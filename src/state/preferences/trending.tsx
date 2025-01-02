import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = {
  trendingDisabled: Exclude<persisted.Schema['trendingDisabled'], undefined>
}
type ApiContext = {
  setTrendingDisabled(
    hidden: Exclude<persisted.Schema['trendingDisabled'], undefined>,
  ): void
}

const StateContext = React.createContext<StateContext>({
  trendingDisabled: Boolean(persisted.defaults.trendingDisabled),
})
const ApiContext = React.createContext<ApiContext>({
  setTrendingDisabled() {},
})

function usePersistedBooleanValue<T extends keyof persisted.Schema>(key: T) {
  const [value, _set] = React.useState(() => {
    return Boolean(persisted.get(key))
  })
  const set = React.useCallback<
    (value: Exclude<persisted.Schema[T], undefined>) => void
  >(
    hidden => {
      _set(Boolean(hidden))
      persisted.write(key, hidden)
    },
    [key, _set],
  )
  React.useEffect(() => {
    return persisted.onUpdate(key, hidden => {
      _set(Boolean(hidden))
    })
  }, [key, _set])

  return [value, set] as const
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [trendingDisabled, setTrendingDisabled] =
    usePersistedBooleanValue('trendingDisabled')

  /*
   * Context
   */
  const state = React.useMemo(() => ({trendingDisabled}), [trendingDisabled])
  const api = React.useMemo(
    () => ({setTrendingDisabled}),
    [setTrendingDisabled],
  )

  return (
    <StateContext.Provider value={state}>
      <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
    </StateContext.Provider>
  )
}

export function useTrendingSettings() {
  return React.useContext(StateContext)
}

export function useTrendingSettingsApi() {
  return React.useContext(ApiContext)
}
