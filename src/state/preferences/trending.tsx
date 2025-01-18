import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = {
  trendingDisabled: Exclude<persisted.Schema['trendingDisabled'], undefined>
  trendingVideoDisabled: Exclude<
    persisted.Schema['trendingVideoDisabled'],
    undefined
  >
}
type ApiContext = {
  setTrendingDisabled(
    hidden: Exclude<persisted.Schema['trendingDisabled'], undefined>,
  ): void
  setTrendingVideoDisabled(
    hidden: Exclude<persisted.Schema['trendingVideoDisabled'], undefined>,
  ): void
}

const StateContext = React.createContext<StateContext>({
  trendingDisabled: Boolean(persisted.defaults.trendingDisabled),
  trendingVideoDisabled: Boolean(persisted.defaults.trendingVideoDisabled),
})
const ApiContext = React.createContext<ApiContext>({
  setTrendingDisabled() {},
  setTrendingVideoDisabled() {},
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
  const [trendingVideoDisabled, setTrendingVideoDisabled] =
    usePersistedBooleanValue('trendingVideoDisabled')

  /*
   * Context
   */
  const state = React.useMemo(
    () => ({trendingDisabled, trendingVideoDisabled}),
    [trendingDisabled, trendingVideoDisabled],
  )
  const api = React.useMemo(
    () => ({setTrendingDisabled, setTrendingVideoDisabled}),
    [setTrendingDisabled, setTrendingVideoDisabled],
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
