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
  // refetches at most every minute
  const {data: config, isLoading: isInitialLoad} = useServiceConfigQuery()
  const ctx = React.useMemo<Context>(() => {
    // previously cached value
    const cachedEnabled = device.get(['trendingBetaEnabled'])
    if (isInitialLoad) {
      return {enabled: Boolean(cachedEnabled)}
    }
    const serviceEnabled = Boolean(config?.trendingTopicsEnabled)
    const languageIsSupported = langPrefs.contentLanguages.some(lang => {
      return (config?.trendingTopicsLangs ?? []).includes(lang)
    })
    const enabled = serviceEnabled && languageIsSupported
    // update cache
    device.set(['trendingBetaEnabled'], enabled)
    return {enabled}
  }, [isInitialLoad, config, langPrefs])
  return <Context.Provider value={ctx}>{children}</Context.Provider>
}

export function useTrendingConfig() {
  return React.useContext(Context)
}
