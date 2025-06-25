import {createContext, useCallback, useContext, useMemo, useState} from 'react'

import {wait} from '#/lib/async/wait'
import {isNetworkError} from '#/lib/strings/errors'
import {Logger} from '#/logger'
// import {useAgent} from '#/state/session'
import {useGeolocation} from '#/state/geolocation'

const logger = Logger.create(Logger.Context.AgeAssurance)

type TempAgeAssuranceState = {
  updatedAt?: string
  status: 'unknown' | 'pending' | 'assured'
}

export type AgeAssuranceContextType = {
  required: boolean
  status: TempAgeAssuranceState['status']
}

export type AgeAssuranceAPIContextType = {
  refresh: () => Promise<void>
}

const AgeAssuranceContext = createContext<AgeAssuranceContextType>({
  required: false,
  status: 'unknown',
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
            updatedAt: undefined,
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
    const {status} = ageAssuranceState
    const ctx: AgeAssuranceContextType = {
      required: Boolean(
        geolocation?.isAgeRestrictedGeo && status !== 'assured',
      ),
      status,
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

export function useAgeAssuranceContext() {
  return useContext(AgeAssuranceContext)
}

export function useAgeAssuranceAPIContext() {
  return useContext(AgeAssuranceAPIContext)
}
