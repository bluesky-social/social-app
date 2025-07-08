import {createContext, useContext, useMemo} from 'react'
import {type AppBskyUnspeccedDefs} from '@atproto/api'
import {useQuery} from '@tanstack/react-query'

import {useGetAndRegisterPushToken} from '#/lib/notifications/notifications'
// import {wait} from '#/lib/async/wait'
import {isNetworkError} from '#/lib/strings/errors'
import {Logger} from '#/logger'
import {
  type AgeAssuranceAPIContextType,
  type AgeAssuranceContextType,
} from '#/state/age-assurance/types'
import {useGeolocation} from '#/state/geolocation'
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
  isExempt: false,
  lastInitiatedAt: undefined,
  hasInitiated: false,
})
const AgeAssuranceAPIContext = createContext<AgeAssuranceAPIContextType>({
  // @ts-ignore
  refetch: () => Promise.resolve(),
})

export function Provider({children}: {children: React.ReactNode}) {
  const agent = useAgent()
  const {geolocation} = useGeolocation()
  const getAndRegisterPushToken = useGetAndRegisterPushToken()
  const isAgeRestrictedGeo = !!geolocation?.isAgeRestrictedGeo

  const {data, isFetched, refetch} = useQuery({
    /**
     * This is load bearing. We always want this query to run and end in a
     * "fetched" state, even if we fall back to defaults. This lets the rest of
     * the app know that we've at least attempted to load the AA state.
     */
    enabled: true,
    queryKey: createAgeAssuranceQueryKey(agent.session?.did ?? 'never'),
    async queryFn() {
      if (!agent.session) return null

      try {
        const {data} = await agent.app.bsky.unspecced.getAgeAssuranceState()
        // const {data} = await wait(
        //   1e3,
        //   (() => ({
        //     data: {
        //       lastInitiatedAt: new Date().toISOString(),
        //       status: 'assured',
        //     } as AppBskyUnspeccedDefs.AgeAssuranceState,
        //   }))(),
        // )

        logger.debug(`fetch`, {
          data,
          account: agent.session?.did,
        })

        // TODO pretty sure we don't need this
        // qc.invalidateQueries({queryKey: preferencesQueryKey})

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

  const ageAssuranceContext = useMemo<AgeAssuranceContextType>(() => {
    const {status, lastInitiatedAt} = data || DEFAULT_AGE_ASSURANCE_STATE
    const ctx: AgeAssuranceContextType = {
      status,
      isLoaded: isFetched,
      lastInitiatedAt,
      hasInitiated: !!lastInitiatedAt,
      isExempt: !isAgeRestrictedGeo,
      isAgeRestricted: Boolean(isAgeRestrictedGeo && status !== 'assured'),
    }

    logger.debug(`context`, ctx)

    return ctx
  }, [isAgeRestrictedGeo, isFetched, data])

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
