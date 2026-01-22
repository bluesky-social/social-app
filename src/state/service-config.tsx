import {createContext, useContext, useMemo} from 'react'

import {useLanguagePrefs} from '#/state/preferences/languages'
import {useServiceConfigQuery} from '#/state/queries/service-config'
import {useSession} from '#/state/session'
import {useAnalytics} from '#/analytics'
import {IS_DEV} from '#/env'
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

const LiveNowContext = createContext<LiveNowContext>([])
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

const DEFAULT_LIVE_ALLOWED_DOMAINS = [
  'twitch.tv',
  'www.twitch.tv',
  'stream.place',
]
export type LiveNowConfig = {
  allowedDomains: Set<string>
}
export function useLiveNowConfig(): LiveNowConfig {
  const ctx = useContext(LiveNowContext)
  const canGoLive = useCanGoLive()
  const {currentAccount} = useSession()
  if (!currentAccount?.did || !canGoLive) return {allowedDomains: new Set()}
  const vip = ctx.find(live => live.did === currentAccount.did)
  return {
    allowedDomains: new Set(
      DEFAULT_LIVE_ALLOWED_DOMAINS.concat(vip ? vip.domains : []),
    ),
  }
}

export function useCanGoLive() {
  const ax = useAnalytics()
  const {hasSession} = useSession()
  if (!hasSession) return false
  return IS_DEV ? true : !ax.features.enabled(ax.features.LiveNowBetaDisable)
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
