import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = {
  trendingSidebarHidden: Exclude<
    persisted.Schema['trendingSidebarHidden'],
    undefined
  >
  trendingDiscoverHidden: Exclude<
    persisted.Schema['trendingDiscoverHidden'],
    undefined
  >
}
type ApiContext = {
  setTrendingSidebarHidden(
    hidden: Exclude<persisted.Schema['trendingSidebarHidden'], undefined>,
  ): void
  setTrendingDiscoverHidden(
    hidden: Exclude<persisted.Schema['trendingDiscoverHidden'], undefined>,
  ): void
}

const StateContext = React.createContext<StateContext>({
  trendingSidebarHidden: Boolean(persisted.defaults.trendingSidebarHidden),
  trendingDiscoverHidden: Boolean(persisted.defaults.trendingDiscoverHidden),
})
const ApiContext = React.createContext<ApiContext>({
  setTrendingSidebarHidden() {},
  setTrendingDiscoverHidden() {},
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
  const [trendingSidebarHidden, setTrendingSidebarHidden] =
    usePersistedBooleanValue('trendingSidebarHidden')
  const [trendingDiscoverHidden, setTrendingDiscoverHidden] =
    usePersistedBooleanValue('trendingDiscoverHidden')

  /*
   * Context
   */
  const state = React.useMemo(
    () => ({trendingSidebarHidden, trendingDiscoverHidden}),
    [trendingSidebarHidden, trendingDiscoverHidden],
  )
  const api = React.useMemo(
    () => ({setTrendingSidebarHidden, setTrendingDiscoverHidden}),
    [setTrendingSidebarHidden, setTrendingDiscoverHidden],
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
