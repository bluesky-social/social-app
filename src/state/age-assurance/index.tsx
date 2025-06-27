import {createContext, useContext, useMemo} from 'react'
import {useQuery, useQueryClient} from '@tanstack/react-query'

import {wait} from '#/lib/async/wait'
import {isNetworkError} from '#/lib/strings/errors'
import {Logger} from '#/logger'
import {
  type AgeAssuranceAPIContextType,
  type AgeAssuranceContextType,
  type AppBskyUnspeccedDefs,
} from '#/state/age-assurance/types'
import {useGeolocation} from '#/state/geolocation'
import {preferencesQueryKey} from '#/state/queries/preferences'
import {useAgent} from '#/state/session'

const logger = Logger.create(Logger.Context.AgeAssurance)
const createAgeAssuranceQueryKey = (did: string) =>
  ['ageAssurance', did] as const
const DEFAULT_AGE_ASSURANCE_STATE: AppBskyUnspeccedDefs.AgeAssuranceState = {
  lastInitiatedAt: undefined,
  status: 'unknown',
}
const AgeAssuranceContext = createContext<AgeAssuranceContextType>({
  isLoaded: false,
  isAgeRestricted: false,
  isExempt: false,
  lastInitiatedAt: undefined,
  hasInitiated: false,
})
const AgeAssuranceAPIContext = createContext<AgeAssuranceAPIContextType>({
  // @ts-ignore
  refetch: () => Promise.resolve(),
})

export function Provider({children}: {children: React.ReactNode}) {
  const qc = useQueryClient()
  const agent = useAgent()
  const {geolocation} = useGeolocation()

  const {data, isFetched, refetch} = useQuery({
    enabled: !!agent.session,
    queryKey: createAgeAssuranceQueryKey(agent.session?.did ?? 'never'),
    async queryFn() {
      try {
        const {data} = await wait(
          1e3,
          (() => ({
            data: {
              lastInitiatedAt: undefined,
              status: 'unknown',
            } as AppBskyUnspeccedDefs.AgeAssuranceState,
          }))(),
        )

        logger.debug(`fetch`, {
          data,
          account: agent.session?.did,
        })

        qc.invalidateQueries({queryKey: preferencesQueryKey})

        return data
      } catch (e) {
        if (!isNetworkError(e)) {
          logger.error(`ageAssurance: failed to fetch`, {safeMessage: e})
        }
      }
    },
  })

  const ageAssuranceContext = useMemo<AgeAssuranceContextType>(() => {
    const isAgeRestrictedGeo = !!geolocation?.isAgeRestrictedGeo
    const {status, lastInitiatedAt} = data || DEFAULT_AGE_ASSURANCE_STATE
    const ctx: AgeAssuranceContextType = {
      isLoaded: isFetched,
      lastInitiatedAt,
      hasInitiated: !!lastInitiatedAt,
      isExempt: !isAgeRestrictedGeo,
      isAgeRestricted: Boolean(isAgeRestrictedGeo && status !== 'assured'),
    }

    logger.debug(`context`, ctx)

    return ctx
  }, [geolocation, isFetched, data])

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

export function useAgeAssuranceContext() {
  return useContext(AgeAssuranceContext)
}

export function useAgeAssuranceAPIContext() {
  return useContext(AgeAssuranceAPIContext)
}
