import React from 'react'

import {useLanguagePrefs} from '#/state/preferences/languages'
import {useServiceConfigQuery} from '#/state/queries/service-config'
import {device} from '#/storage'

type Context = {
  enabled: boolean
}

const Context = React.createContext<Context>({
  enabled: false,
})

export function Provider({children}: React.PropsWithChildren<{}>) {
  const langPrefs = useLanguagePrefs()
  const {data: config, isLoading: isInitialLoad} = useServiceConfigQuery()
  const ctx = React.useMemo<Context>(() => {
    if (__DEV__) {
      return {enabled: true}
    }

    /*
     * Only English during beta period
     */
    if (
      !!langPrefs.contentLanguages.length &&
      !langPrefs.contentLanguages.includes('en')
    ) {
      return {enabled: false}
    }

    /*
     * While loading, use cached value
     */
    const cachedEnabled = device.get(['trendingBetaEnabled'])
    if (isInitialLoad) {
      return {enabled: Boolean(cachedEnabled)}
    }

    /*
     * Doing an extra check here to reduce hits to statsig. If it's disabled on
     * the server, we can exit early.
     */
    const enabled = Boolean(config?.topicsEnabled)

    // update cache
    device.set(['trendingBetaEnabled'], enabled)

    return {enabled}
  }, [isInitialLoad, config, langPrefs.contentLanguages])
  return <Context.Provider value={ctx}>{children}</Context.Provider>
}

export function useTrendingConfig() {
  return React.useContext(Context)
}
