import {createContext, useCallback, useContext, useMemo, useState} from 'react'

import {wait} from '#/lib/async/wait'
import {isNetworkError} from '#/lib/strings/errors'
import {Logger} from '#/logger'
// import {useAgent} from '#/state/session'
import {useGeolocation} from '#/state/geolocation'

const logger = Logger.create(Logger.Context.AgeAssurance)

type TempAgeAssuranceState = {
  lastInitiatedAt?: string
  status: 'unknown' | 'pending' | 'assured'
}

export type AgeAssuranceContextType = {
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
  refresh: () => Promise<void>
}

const AgeAssuranceContext = createContext<AgeAssuranceContextType>({
  isAgeRestricted: false,
  status: 'unknown',
  lastInitiatedAt: undefined,
  hasInitiated: false,
})

const AgeAssuranceAPIContext = createContext<AgeAssuranceAPIContextType>({
  refresh: () => Promise.resolve(),
})

export function Provider({children}: {children: React.ReactNode}) {
  // const agent = useAgent()
  const {geolocation} = useGeolocation()
  const [ageAssuranceState, setAgeAssuranceState] =
    useState<TempAgeAssuranceState>({
      status: 'unknown',
    })

  const refresh = useCallback(async () => {
    try {
      const {data} = await wait(
        200,
        (() => ({
          data: {
            lastInitiatedAt: undefined,
            status: 'unknown',
          } as TempAgeAssuranceState,
        }))(),
      )

      logger.debug(`refresh`, {data})

      setAgeAssuranceState(data)
    } catch (e) {
      if (!isNetworkError(e)) {
        logger.error(`ageAssurance: failed to refresh`, {safeMessage: e})
      }
    }
  }, [setAgeAssuranceState])

  const ageAssuranceContext = useMemo<AgeAssuranceContextType>(() => {
    const {status, lastInitiatedAt} = ageAssuranceState
    const ctx: AgeAssuranceContextType = {
      status,
      lastInitiatedAt,
      hasInitiated: !!lastInitiatedAt,
      isAgeRestricted: Boolean(
        geolocation?.isAgeRestrictedGeo && status !== 'assured',
      ),
    }

    logger.debug(`context`, ctx)

    return ctx
  }, [geolocation, ageAssuranceState])

  const ageAssuranceAPIContext = useMemo<AgeAssuranceAPIContextType>(
    () => ({
      refresh,
    }),
    [refresh],
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
