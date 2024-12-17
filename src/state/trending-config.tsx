import React from 'react'

import {useServiceConfigQuery} from '#/state/queries/service-config'
import {device} from '#/storage'

type Context = {
  enabled: boolean
}

const Context = React.createContext<Context>({
  enabled: false,
})

export function Provider({children}: React.PropsWithChildren<{}>) {
  // refetches at most every minute
  const {data: config, isLoading: isInitialLoad} = useServiceConfigQuery()
  const ctx = React.useMemo<Context>(() => {
    // previously cached value
    const cachedEnabled = device.get(['trendingBetaEnabled'])
    if (isInitialLoad) {
      return {enabled: Boolean(cachedEnabled)}
    }
    const enabled = Boolean(config?.topicsEnabled)
    // update cache
    device.set(['trendingBetaEnabled'], enabled)
    return {enabled}
  }, [isInitialLoad, config])
  return <Context.Provider value={ctx}>{children}</Context.Provider>
}

export function useTrendingConfig() {
  return React.useContext(Context)
}
