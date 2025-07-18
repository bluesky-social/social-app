import {createContext, useContext, useMemo, useState} from 'react'
import {type AppBskyUnspeccedDefs} from '@atproto/api'
import {useQuery} from '@tanstack/react-query'

import {networkRetry} from '#/lib/async/retry'
import {useGetAndRegisterPushToken} from '#/lib/notifications/notifications'
import {useGate} from '#/lib/statsig/statsig'
import {isNetworkError} from '#/lib/strings/errors'
import {
  type AgeAssuranceAPIContextType,
  type AgeAssuranceContextType,
} from '#/state/ageAssurance/types'
import {useIsAgeAssuranceEnabled} from '#/state/ageAssurance/useIsAgeAssuranceEnabled'
import {logger} from '#/state/ageAssurance/util'
import {useGeolocation} from '#/state/geolocation'
import {useAgent} from '#/state/session'

export const createAgeAssuranceQueryKey = (did: string) =>
  ['ageAssurance', did] as const

const DEFAULT_AGE_ASSURANCE_STATE: AppBskyUnspeccedDefs.AgeAssuranceState = {
  lastInitiatedAt: undefined,
  status: 'unknown',
}

const AgeAssuranceContext = createContext<AgeAssuranceContextType>({
  status: 'unknown',
  isReady: false,
  lastInitiatedAt: undefined,
  isAgeRestricted: false,
})

const AgeAssuranceAPIContext = createContext<AgeAssuranceAPIContextType>({
  // @ts-ignore can't be bothered to type this
  refetch: () => Promise.resolve(),
})

/**
 * Low-level provider for fetching age assurance state on app load. Do not add
 * any other data fetching in here to avoid complications and reduced
 * performance.
 */
export function Provider({children}: {children: React.ReactNode}) {
  const gate = useGate()
  const agent = useAgent()
  const {geolocation} = useGeolocation()
  const isAgeAssuranceEnabled = useIsAgeAssuranceEnabled()
  const getAndRegisterPushToken = useGetAndRegisterPushToken()
  const [refetchWhilePending, setRefetchWhilePending] = useState(false)

  const {data, isFetched, refetch} = useQuery({
    /**
     * This is load bearing. We always want this query to run and end in a
     * "fetched" state, even if we fall back to defaults. This lets the rest of
     * the app know that we've at least attempted to load the AA state.
     *
     * However, it only needs to run if AA is enabled.
     */
    enabled: isAgeAssuranceEnabled,
    refetchOnWindowFocus: refetchWhilePending,
    queryKey: createAgeAssuranceQueryKey(agent.session?.did ?? 'never'),
    async queryFn() {
      if (!agent.session) return null

      try {
        const {data} = await networkRetry(3, () =>
          agent.app.bsky.unspecced.getAgeAssuranceState(),
        )
        // const {data} = {
        //   data: {
        //     lastInitiatedAt: new Date().toISOString(),
        //     status: 'pending',
        //   } as AppBskyUnspeccedDefs.AgeAssuranceState,
        // }

        logger.debug(`fetch`, {
          data,
          account: agent.session?.did,
        })

        if (gate('age_assurance')) {
          await getAndRegisterPushToken({
            isAgeRestricted:
              !!geolocation?.isAgeRestrictedGeo && data.status !== 'assured',
          })
        }

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
    const {status, lastInitiatedAt} = data || DEFAULT_AGE_ASSURANCE_STATE
    const ctx: AgeAssuranceContextType = {
      isReady: isFetched || !isAgeAssuranceEnabled,
      status,
      lastInitiatedAt,
      isAgeRestricted: isAgeAssuranceEnabled ? status !== 'assured' : false,
    }
    logger.debug(`context`, ctx)
    return ctx
  }, [isFetched, data, isAgeAssuranceEnabled])

  if (
    !!ageAssuranceContext.lastInitiatedAt &&
    ageAssuranceContext.status === 'pending' &&
    !refetchWhilePending
  ) {
    /*
     * If we have a pending state, we want to refetch on window focus to ensure
     * that we get the latest state when the user returns to the app.
     */
    setRefetchWhilePending(true)
  } else if (
    !!ageAssuranceContext.lastInitiatedAt &&
    ageAssuranceContext.status !== 'pending' &&
    refetchWhilePending
  ) {
    setRefetchWhilePending(false)
  }

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
