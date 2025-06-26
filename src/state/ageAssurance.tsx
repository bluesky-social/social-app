import {createContext, useContext, useMemo} from 'react'
import {
  // useQueryClient,
  type QueryObserverBaseResult,
  useQuery,
} from '@tanstack/react-query'

import {wait} from '#/lib/async/wait'
import {isNetworkError} from '#/lib/strings/errors'
import {Logger} from '#/logger'
import {useGeolocation} from '#/state/geolocation'
import {useAgent} from '#/state/session'

const logger = Logger.create(Logger.Context.AgeAssurance)
const ageAssuranceQueryKey = ['ageAssurance'] as const
const DEFAULT_AGE_ASSURANCE_STATE: TempAgeAssuranceState = {
  status: 'unknown',
}

type TempAgeAssuranceState = {
  lastInitiatedAt?: string
  status: 'unknown' | 'pending' | 'assured'
}

export type AgeAssuranceContextType = {
  isLoaded: boolean
  /**
   * Whether the current user is age-restricted based on their geolocation and
   * age assurance state retrieved from the server.
   */
  isAgeRestricted: boolean
  /**
   * The current age assurance status retrieved from the server.
   */
  status: TempAgeAssuranceState['status']
  /**
   * The last time the age assurance state was attempted by the user.
   */
  lastInitiatedAt: string | undefined
  /**
   * Whether the user has initiated an age assurance check.
   */
  hasInitiated: boolean
}

export type AgeAssuranceAPIContextType = {
  /**
   * Refreshes the age assurance state by fetching it from the server.
   */
  refetch: QueryObserverBaseResult['refetch']
}

const AgeAssuranceContext = createContext<AgeAssuranceContextType>({
  isLoaded: false,
  isAgeRestricted: false,
  status: 'unknown',
  lastInitiatedAt: undefined,
  hasInitiated: false,
})

const AgeAssuranceAPIContext = createContext<AgeAssuranceAPIContextType>({
  // @ts-ignore
  refetch: () => Promise.resolve(),
})

export function Provider({children}: {children: React.ReactNode}) {
  // const qc = useQueryClient()
  const agent = useAgent()
  const {geolocation} = useGeolocation()

  const {data, refetch} = useQuery({
    queryKey: ageAssuranceQueryKey,
    async queryFn() {
      try {
        const {data} = await wait(
          1e3,
          (() => ({
            data: {
              lastInitiatedAt: new Date().toISOString(),
              status: 'assured',
            } as TempAgeAssuranceState,
          }))(),
        )

        logger.debug(`fetch`, {
          data,
          account: agent.session?.did,
        })

        return data
      } catch (e) {
        if (!isNetworkError(e)) {
          logger.error(`ageAssurance: failed to fetch`, {safeMessage: e})
        }

        return DEFAULT_AGE_ASSURANCE_STATE
      }
    },
  })

  const ageAssuranceContext = useMemo<AgeAssuranceContextType>(() => {
    const {status, lastInitiatedAt} = data || DEFAULT_AGE_ASSURANCE_STATE
    const ctx: AgeAssuranceContextType = {
      isLoaded: !!data,
      status,
      lastInitiatedAt,
      hasInitiated: !!lastInitiatedAt,
      isAgeRestricted: Boolean(
        geolocation?.isAgeRestrictedGeo && status !== 'assured',
      ),
    }

    logger.debug(`context`, ctx)

    return ctx
  }, [geolocation, data])

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
 * Returns the current age assurance state from context. This data is awaited
 * prior to rendering the app, and therefore the data here should be up to date
 * and trustworth by the time we're rendering anything inside the `Splash`
 * wrapper in the root component files.
 */
export function useAgeAssuranceContext() {
  return useContext(AgeAssuranceContext)
}

export function useAgeAssuranceAPIContext() {
  return useContext(AgeAssuranceAPIContext)
}
