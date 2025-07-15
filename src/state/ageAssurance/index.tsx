import {createContext, useContext, useMemo} from 'react'
import {type AppBskyUnspeccedDefs} from '@atproto/api'
import {useQuery} from '@tanstack/react-query'

import {networkRetry} from '#/lib/async/retry'
import {useGetAndRegisterPushToken} from '#/lib/notifications/notifications'
import {useGate} from '#/lib/statsig/statsig'
// import {wait} from '#/lib/async/wait'
import {isNetworkError} from '#/lib/strings/errors'
import {Logger} from '#/logger'
import {
  type AgeAssuranceAPIContextType,
  type AgeAssuranceContextType,
} from '#/state/ageAssurance/types'
import {useGeolocation} from '#/state/geolocation'
import {STALE} from '#/state/queries'
import {useAgent} from '#/state/session'

const logger = Logger.create(Logger.Context.AgeAssurance)
export const createAgeAssuranceQueryKey = (did: string) =>
  ['ageAssurance', did] as const
const DEFAULT_AGE_ASSURANCE_STATE: AppBskyUnspeccedDefs.AgeAssuranceState = {
  lastInitiatedAt: undefined,
  status: 'unknown',
}
const AgeAssuranceContext = createContext<AgeAssuranceContextType>({
  status: 'unknown',
  isLoaded: false,
  isAgeRestricted: false,
  lastInitiatedAt: undefined,
})
const AgeAssuranceAPIContext = createContext<AgeAssuranceAPIContextType>({
  // @ts-ignore
  refetch: () => Promise.resolve(),
})

/**
 * Low-level provider for fetching age assurance state on app load. Do not add
 * any other data fetching in here to avoid complications and reduced
 * performance.
 */
export function Provider({children}: {children: React.ReactNode}) {
  const agent = useAgent()
  const {geolocation} = useGeolocation()
  const getAndRegisterPushToken = useGetAndRegisterPushToken()
  const isAgeRestrictedGeo = !!geolocation?.isAgeRestrictedGeo
  const gate = useGate()

  const {data, isFetched, refetch} = useQuery({
    /**
     * This is load bearing. We always want this query to run and end in a
     * "fetched" state, even if we fall back to defaults. This lets the rest of
     * the app know that we've at least attempted to load the AA state.
     */
    enabled: true,
    queryKey: createAgeAssuranceQueryKey(agent.session?.did ?? 'never'),
    staleTime: STALE.MINUTES.ONE,
    refetchOnWindowFocus: true,
    async queryFn() {
      if (!agent.session) return null

      try {
        const {data} = await networkRetry(3, () =>
          agent.app.bsky.unspecced.getAgeAssuranceState(),
        )
        // const {data} = await wait(
        //   1e3,
        //   (() => ({
        //     data: {
        //       lastInitiatedAt: undefined,//new Date().toISOString(),
        //       status: 'unknown',
        //     } as AppBskyUnspeccedDefs.AgeAssuranceState,
        //   }))(),
        // )

        logger.debug(`fetch`, {
          data,
          account: agent.session?.did,
        })

        await getAndRegisterPushToken({
          isAgeRestricted: Boolean(
            isAgeRestrictedGeo && data.status !== 'assured',
          ),
        })

        return data
      } catch (e) {
        if (!isNetworkError(e)) {
          logger.error(`ageAssurance: failed to fetch`, {safeMessage: e})
        }
        // don't re-throw error, we'll just fall back to defaults
        return null
      }
    },
  })

  /**
   * Derive state, or fall back to defaults
   */
  const ageAssuranceContext = useMemo<AgeAssuranceContextType>(() => {
    const enabled = __DEV__ || gate('age_assurance')
    const {status, lastInitiatedAt} = data || DEFAULT_AGE_ASSURANCE_STATE
    const ctx: AgeAssuranceContextType = {
      isLoaded: isFetched,
      status,
      lastInitiatedAt,
      isAgeRestricted: isAgeRestrictedGeo && status !== 'assured' && enabled,
    }

    logger.debug(`context`, ctx)

    return ctx
  }, [gate, isAgeRestrictedGeo, isFetched, data])

  const ageAssuranceAPIContext = useMemo<AgeAssuranceAPIContextType>(
    () => ({
      refetch,
    }),
    [refetch],
  )

  return (
    <AgeAssuranceAPIContext.Provider value={ageAssuranceAPIContext}>
      <AgeAssuranceContext.Provider value={ageAssuranceContext}>
        {children}
      </AgeAssuranceContext.Provider>
    </AgeAssuranceAPIContext.Provider>
  )
}

/**
 * Access to low-level AA state. Prefer using {@link useAgeInfo} for a
 * more user-friendly interface.
 */
export function useAgeAssuranceContext() {
  return useContext(AgeAssuranceContext)
}

export function useAgeAssuranceAPIContext() {
  return useContext(AgeAssuranceAPIContext)
}
