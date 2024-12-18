import React from 'react'

import {useGate} from '#/lib/statsig/statsig'
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
  const gate = useGate()
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
    if (!enabled) {
      // cache for next reload
      device.set(['trendingBetaEnabled'], enabled)
      return {enabled: false}
    }

    /*
     * Service is enabled, but also check statsig in case we're rolling back.
     */
    const gateEnabled = gate('trending_topics_beta')
    const _enabled = enabled && gateEnabled

    // update cache
    device.set(['trendingBetaEnabled'], _enabled)

    return {enabled: _enabled}
  }, [isInitialLoad, config, gate, langPrefs.contentLanguages])
  return <Context.Provider value={ctx}>{children}</Context.Provider>
}

export function useTrendingConfig() {
  return React.useContext(Context)
}
