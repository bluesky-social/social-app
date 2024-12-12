import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = {
  trendingSidebarHidden: persisted.Schema['trendingSidebarHidden']
}
type ApiContext = {
  setTrendingSidebarHidden(
    hidden: Exclude<persisted.Schema['trendingSidebarHidden'], undefined>,
  ): void
}

const StateContext = React.createContext<StateContext>({
  trendingSidebarHidden: persisted.defaults.trendingSidebarHidden,
})
const ApiContext = React.createContext<ApiContext>({
  setTrendingSidebarHidden() {},
})

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [trendingSidebarHidden, _setTrendingSidebarHidden] = React.useState(
    () => {
      return Boolean(persisted.get('trendingSidebarHidden'))
    },
  )

  const setTrendingSidebarHidden = React.useCallback<
    ApiContext['setTrendingSidebarHidden']
  >(
    hidden => {
      _setTrendingSidebarHidden(hidden)
      persisted.write('trendingSidebarHidden', hidden)
    },
    [_setTrendingSidebarHidden],
  )

  React.useEffect(() => {
    return persisted.onUpdate('trendingSidebarHidden', hidden => {
      _setTrendingSidebarHidden(Boolean(hidden))
    })
  }, [_setTrendingSidebarHidden])

  const state = React.useMemo(
    () => ({trendingSidebarHidden}),
    [trendingSidebarHidden],
  )
  const api = React.useMemo(
    () => ({setTrendingSidebarHidden}),
    [setTrendingSidebarHidden],
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
