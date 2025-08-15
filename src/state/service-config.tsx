import {createContext, useContext, useMemo} from 'react'

import {useLanguagePrefs} from '#/state/preferences/languages'
import {useServiceConfigQuery} from '#/state/queries/service-config'
import {device} from '#/storage'

type TrendingContext = {
  enabled: boolean
}

type LiveNowContext = {
  did: string
  domains: string[]
}[]

const TrendingContext = createContext<TrendingContext>({
  enabled: false,
})
TrendingContext.displayName = 'TrendingContext'

const LiveNowContext = createContext<LiveNowContext | null>(null)
LiveNowContext.displayName = 'LiveNowContext'

const CheckEmailConfirmedContext = createContext<boolean | null>(null)

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

  const liveNow = useMemo<LiveNowContext>(() => config?.liveNow ?? [], [config])

  // probably true, so default to true when loading
  // if the call fails, the query will set it to false for us
  const checkEmailConfirmed = config?.checkEmailConfirmed ?? true

  return (
    <TrendingContext.Provider value={trending}>
      <LiveNowContext.Provider value={liveNow}>
        <CheckEmailConfirmedContext.Provider value={checkEmailConfirmed}>
          {children}
        </CheckEmailConfirmedContext.Provider>
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
      'useLiveNowConfig must be used within a ServiceConfigManager',
    )
  }
  return ctx
}

export function useCanGoLive(did?: string) {
  const config = useLiveNowConfig()
  return !!config.find(cfg => cfg.did === did)
}

export function useCheckEmailConfirmed() {
  const ctx = useContext(CheckEmailConfirmedContext)
  if (ctx === null) {
    throw new Error(
      'useCheckEmailConfirmed must be used within a ServiceConfigManager',
    )
  }
  return ctx
}
