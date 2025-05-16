import {createContext, useContext, useMemo} from 'react'

import {useLanguagePrefs} from '#/state/preferences/languages'
import {useServiceConfigQuery} from '#/state/queries/service-config'
import {device} from '#/storage'

type TrendingContext = {
  enabled: boolean
}

const TrendingContext = createContext<TrendingContext>({
  enabled: false,
})

const LiveNowContext = createContext<{
  dids: string[]
  domains: string[]
} | null>(null)

export function Provider({children}: {children: React.ReactNode}) {
  const langPrefs = useLanguagePrefs()
  const {data: config, isLoading: isInitialLoad} = useServiceConfigQuery()
  const trending = useMemo<TrendingContext>(() => {
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

  const liveNow = useMemo(
    () =>
      config?.liveNow ?? {
        dids: [],
        domains: [],
      },
    [config],
  )

  return (
    <TrendingContext.Provider value={trending}>
      <LiveNowContext.Provider value={liveNow}>
        {children}
      </LiveNowContext.Provider>
    </TrendingContext.Provider>
  )
}

export function useTrendingConfig() {
  return useContext(TrendingContext)
}

export function useLiveNowConfig() {
  const ctx = useContext(LiveNowContext)
  if (!ctx) {
    throw new Error(
      'useLiveNowConfig must be used within a LiveNowConfigProvider',
    )
  }
  return ctx
}

export function useCanGoLive(did?: string) {
  const {dids} = useLiveNowConfig()
  return dids.includes(did ?? 'pwi')
}
