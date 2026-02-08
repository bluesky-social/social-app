import {createContext, useCallback, useContext, useEffect, useMemo} from 'react'
import {
  type AppBskyAgeassuranceDefs,
  type AppBskyAgeassuranceGetConfig,
  type AppBskyAgeassuranceGetState,
  AtpAgent,
  getAgeAssuranceRegionConfig,
} from '@atproto/api'
import {createAsyncStoragePersister} from '@tanstack/query-async-storage-persister'
import {focusManager, QueryClient, useQuery} from '@tanstack/react-query'
import {persistQueryClient} from '@tanstack/react-query-persist-client'
import debounce from 'lodash.debounce'

import {networkRetry} from '#/lib/async/retry'
import {PUBLIC_BSKY_SERVICE} from '#/lib/constants'
import {createPersistedQueryStorage} from '#/lib/persisted-query-storage'
import {getAge} from '#/lib/strings/time'
import {
  hasSnoozedBirthdateUpdateForDid,
  snoozeBirthdateUpdateAllowedForDid,
} from '#/state/birthdate'
import {useAgent, useSession} from '#/state/session'
import * as debug from '#/ageAssurance/debug'
import {logger} from '#/ageAssurance/logger'
import {
  getBirthdateStringFromAge,
  isLegacyBirthdateBug,
} from '#/ageAssurance/util'
import {IS_DEV} from '#/env'
import {device} from '#/storage'

/**
 * Special query client for age assurance data so we can prefetch on app
 * load without interfering with other queries.
 */
const qc = new QueryClient({
  defaultOptions: {
    queries: {
      /**
       * We clear this manually, so disable automatic garbage collection.
       * @see https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient#how-it-works
       */
      gcTime: Infinity,
    },
  },
})
const persister = createAsyncStoragePersister({
  storage: createPersistedQueryStorage('age-assurance'),
  key: 'age-assurance-query-client',
})
const [, cacheHydrationPromise] = persistQueryClient({
  queryClient: qc,
  persister,
})

function getDidFromAgentSession(agent: AtpAgent) {
  const sessionManager = agent.sessionManager
  if (!sessionManager || !sessionManager.did) return
  return sessionManager.did
}

/*
 * Optimistic data
 */

const createdAtCache = new Map<string, string>()
export function setCreatedAtForDid({
  did,
  createdAt,
}: {
  did: string
  createdAt: string
}) {
  createdAtCache.set(did, createdAt)
}
const birthdateCache = new Map<string, string>()
export function setBirthdateForDid({
  did,
  birthdate,
}: {
  did: string
  birthdate: string
}) {
  birthdateCache.set(did, birthdate)
}

/*
 * Config
 */

export const configQueryKey = ['config']
export async function getConfig() {
  if (debug.enabled) return debug.resolve(debug.config)
  const agent = new AtpAgent({
    service: PUBLIC_BSKY_SERVICE,
  })
  const res = await agent.app.bsky.ageassurance.getConfig()
  return res.data
}
export function getConfigFromCache():
  | AppBskyAgeassuranceGetConfig.OutputSchema
  | undefined {
  return qc.getQueryData<AppBskyAgeassuranceGetConfig.OutputSchema>(
    configQueryKey,
  )
}
let configPrefetchPromise: Promise<void> | undefined
export async function prefetchConfig() {
  if (configPrefetchPromise) {
    logger.debug(`prefetchAgeAssuranceConfig: already in progress`)
    return
  }

  configPrefetchPromise = new Promise(async resolve => {
    await cacheHydrationPromise
    const cached = getConfigFromCache()

    if (cached) {
      logger.debug(`prefetchAgeAssuranceConfig: using cache`)
      resolve()
    } else {
      try {
        logger.debug(`prefetchAgeAssuranceConfig: resolving...`)
        const res = await networkRetry(3, () => getConfig())
        qc.setQueryData<AppBskyAgeassuranceGetConfig.OutputSchema>(
          configQueryKey,
          res,
        )
      } catch (e: any) {
        logger.warn(`prefetchAgeAssuranceConfig: failed`, {
          safeMessage: e.message,
        })
      } finally {
        resolve()
      }
    }
  })
}
export async function refetchConfig() {
  logger.debug(`refetchConfig: fetching...`)
  const res = await getConfig()
  qc.setQueryData<AppBskyAgeassuranceGetConfig.OutputSchema>(
    configQueryKey,
    res,
  )
  return res
}
export function useConfigQuery() {
  return useQuery(
    {
      /**
       * Will re-fetch when stale, at most every hour (or 5s in dev for easier
       * testing).
       *
       * @see https://tanstack.com/query/latest/docs/framework/react/guides/initial-query-data#initial-data-from-the-cache-with-initialdataupdatedat
       */
      staleTime: IS_DEV ? 5e3 : 1000 * 60 * 60,
      /**
       * N.B. if prefetch failed above, we'll have no `initialData`, and this
       * query will run on startup.
       */
      initialData: getConfigFromCache(),
      initialDataUpdatedAt: () =>
        qc.getQueryState(configQueryKey)?.dataUpdatedAt,
      queryKey: configQueryKey,
      async queryFn() {
        logger.debug(`useConfigQuery: fetching config`)
        return getConfig()
      },
    },
    qc,
  )
}

/*
 * Server state
 */

export function createServerStateQueryKey({did}: {did: string}) {
  return ['serverState', did]
}
export async function getServerState({agent}: {agent: AtpAgent}) {
  if (debug.enabled && debug.serverState)
    return debug.resolve(debug.serverState)
  const geolocation = device.get(['mergedGeolocation'])
  if (!geolocation || !geolocation.countryCode) {
    logger.error(`getServerState: missing geolocation countryCode`)
    return
  }
  const {data} = await agent.app.bsky.ageassurance.getState({
    countryCode: geolocation.countryCode,
    regionCode: geolocation.regionCode,
  })
  const did = getDidFromAgentSession(agent)
  if (data && did && createdAtCache.has(did)) {
    /*
     * If account was just created, just use the local cache if available. On
     * subsequent reloads, the server should have the correct value.
     */
    data.metadata.accountCreatedAt = createdAtCache.get(did)
  }
  return data ?? null
}
export function getServerStateFromCache({
  did,
}: {
  did: string
}): AppBskyAgeassuranceGetState.OutputSchema | undefined {
  return qc.getQueryData<AppBskyAgeassuranceGetState.OutputSchema>(
    createServerStateQueryKey({did}),
  )
}
export async function prefetchServerState({agent}: {agent: AtpAgent}) {
  const did = getDidFromAgentSession(agent)

  if (!did) return

  await cacheHydrationPromise
  const qk = createServerStateQueryKey({did})
  const cached = getServerStateFromCache({did})

  if (cached) {
    logger.debug(`prefetchServerState: using cache`)
    return
  }

  try {
    logger.debug(`prefetchServerState: resolving...`)
    const res = await networkRetry(3, () => getServerState({agent}))
    qc.setQueryData<AppBskyAgeassuranceGetState.OutputSchema>(qk, res)
  } catch (e: any) {
    logger.warn(`prefetchServerState: failed`, {
      safeMessage: e.message,
    })
  }
}
export async function refetchServerState({agent}: {agent: AtpAgent}) {
  const did = getDidFromAgentSession(agent)
  if (!did) return
  logger.debug(`refetchServerState: fetching...`)
  const res = await networkRetry(3, () => getServerState({agent}))
  qc.setQueryData<AppBskyAgeassuranceGetState.OutputSchema>(
    createServerStateQueryKey({did}),
    res,
  )
  return res
}
export function usePatchServerState() {
  const {currentAccount} = useSession()
  return useCallback(
    async (next: AppBskyAgeassuranceDefs.State) => {
      if (!currentAccount) return
      const did = currentAccount.did
      const prev = getServerStateFromCache({did})
      const merged: AppBskyAgeassuranceGetState.OutputSchema = {
        metadata: {},
        ...(prev || {}),
        state: next,
      }
      qc.setQueryData<AppBskyAgeassuranceGetState.OutputSchema>(
        createServerStateQueryKey({did}),
        merged,
      )
    },
    [currentAccount],
  )
}
export function useServerStateQuery() {
  const agent = useAgent()
  const did = getDidFromAgentSession(agent)
  const query = useQuery(
    {
      enabled: !!did,
      initialData: () => {
        if (!did) return
        return getServerStateFromCache({did})
      },
      queryKey: createServerStateQueryKey({did: did!}),
      async queryFn() {
        return getServerState({agent})
      },
    },
    qc,
  )
  const refetch = useMemo(() => debounce(query.refetch, 100), [query.refetch])

  const isAssured = query.data?.state?.status === 'assured'

  /**
   * `refetchOnWindowFocus` doesn't seem to want to work for this custom query
   * client, so we manually subscribe to focus changes.
   */
  useEffect(() => {
    return focusManager.subscribe(() => {
      // logged out
      if (!did) return

      const isFocused = focusManager.isFocused()

      if (!isFocused) return

      const config = getConfigFromCache()
      const geolocation = device.get(['mergedGeolocation'])
      const isAArequired = Boolean(
        config &&
          geolocation &&
          !!getAgeAssuranceRegionConfig(config, {
            countryCode: geolocation?.countryCode ?? '',
            regionCode: geolocation?.regionCode,
          }),
      )

      // only refetch when needed
      if (isAssured || !isAArequired) return

      refetch()
    })
  }, [did, refetch, isAssured])

  return query
}

/*
 * Other required data
 */

export type OtherRequiredData = {
  birthdate: string | undefined
}
export function createOtherRequiredDataQueryKey({did}: {did: string}) {
  return ['otherRequiredData', did]
}
export async function getOtherRequiredData({
  agent,
}: {
  agent: AtpAgent
}): Promise<OtherRequiredData> {
  if (debug.enabled) return debug.resolve(debug.otherRequiredData)
  const [prefs] = await Promise.all([agent.getPreferences()])
  const data: OtherRequiredData = {
    birthdate: prefs.birthDate ? prefs.birthDate.toISOString() : undefined,
  }

  /**
   * If we can't read a birthdate, it may be due to the user accessing the
   * account via an app password. In that case, fall-back to declared age
   * flags.
   */
  if (!data.birthdate) {
    if (prefs.declaredAge?.isOverAge18) {
      data.birthdate = getBirthdateStringFromAge(18)
    } else if (prefs.declaredAge?.isOverAge16) {
      data.birthdate = getBirthdateStringFromAge(16)
    } else if (prefs.declaredAge?.isOverAge13) {
      data.birthdate = getBirthdateStringFromAge(13)
    }
  }

  const did = getDidFromAgentSession(agent)
  if (data && did && birthdateCache.has(did)) {
    /*
     * If birthdate was just set, use the local cache value. On subsequent
     * reloads, the server should have the correct value.
     */
    data.birthdate = birthdateCache.get(did)
  }

  /**
   * If the user is under the minimum age, and the birthdate is not due to the
   * legacy bug, AND we've not already snoozed their birthdate update, snooze
   * further birthdate updates for this user.
   *
   * This is basically a migration step for this initial rollout.
   */
  if (
    data.birthdate &&
    !isLegacyBirthdateBug(data.birthdate) &&
    !hasSnoozedBirthdateUpdateForDid(did!)
  ) {
    snoozeBirthdateUpdateAllowedForDid(did!)
  }

  return data
}
export function getOtherRequiredDataFromCache({
  did,
}: {
  did: string
}): OtherRequiredData | undefined {
  return qc.getQueryData<OtherRequiredData>(
    createOtherRequiredDataQueryKey({did}),
  )
}
export async function prefetchOtherRequiredData({agent}: {agent: AtpAgent}) {
  const did = getDidFromAgentSession(agent)

  if (!did) return

  await cacheHydrationPromise
  const qk = createOtherRequiredDataQueryKey({did})
  const cached = getOtherRequiredDataFromCache({did})

  if (cached) {
    logger.debug(`prefetchOtherRequiredData: using cache`)
    return
  }

  try {
    logger.debug(`prefetchOtherRequiredData: resolving...`)
    const res = await networkRetry(3, () => getOtherRequiredData({agent}))
    qc.setQueryData<OtherRequiredData>(qk, res)
  } catch (e: any) {
    logger.warn(`prefetchOtherRequiredData: failed`, {
      safeMessage: e.message,
    })
  }
}
export function usePatchOtherRequiredData() {
  const {currentAccount} = useSession()
  return useCallback(
    async (next: OtherRequiredData) => {
      if (!currentAccount) return
      const did = currentAccount.did
      const prev = getOtherRequiredDataFromCache({did})
      const merged: OtherRequiredData = {
        ...(prev || {}),
        ...next,
      }
      qc.setQueryData<OtherRequiredData>(
        createOtherRequiredDataQueryKey({did}),
        merged,
      )
    },
    [currentAccount],
  )
}
export function useOtherRequiredDataQuery() {
  const agent = useAgent()
  const did = getDidFromAgentSession(agent)
  return useQuery(
    {
      enabled: !!did,
      initialData: () => {
        if (!did) return
        return getOtherRequiredDataFromCache({did})
      },
      queryKey: createOtherRequiredDataQueryKey({did: did!}),
      async queryFn() {
        return getOtherRequiredData({agent})
      },
    },
    qc,
  )
}

/**
 * Helper to prefetch all age assurance data.
 */
export function prefetchAgeAssuranceData({agent}: {agent: AtpAgent}) {
  return Promise.allSettled([
    // config fetch initiated at the top of the App.platform.tsx files, awaited here
    configPrefetchPromise,
    prefetchServerState({agent}),
    prefetchOtherRequiredData({agent}),
  ])
}

export function clearAgeAssuranceDataForDid({did}: {did: string}) {
  logger.debug(`clearAgeAssuranceDataForDid: ${did}`)
  qc.removeQueries({queryKey: createServerStateQueryKey({did}), exact: true})
  qc.removeQueries({
    queryKey: createOtherRequiredDataQueryKey({did}),
    exact: true,
  })
}

export function clearAgeAssuranceData() {
  logger.debug(`clearAgeAssuranceData`)
  qc.clear()
}

/*
 * Context
 */

export type AgeAssuranceData = {
  config: AppBskyAgeassuranceDefs.Config | undefined
  state: AppBskyAgeassuranceDefs.State | undefined
  data:
    | {
        accountCreatedAt: AppBskyAgeassuranceDefs.StateMetadata['accountCreatedAt']
        declaredAge: number | undefined
        birthdate: string | undefined
      }
    | undefined
}
export const AgeAssuranceDataContext = createContext<AgeAssuranceData>({
  config: undefined,
  state: undefined,
  data: {
    accountCreatedAt: undefined,
    declaredAge: undefined,
    birthdate: undefined,
  },
})
export function useAgeAssuranceDataContext() {
  return useContext(AgeAssuranceDataContext)
}
export function AgeAssuranceDataProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const {data: config} = useConfigQuery()
  const serverState = useServerStateQuery()
  const {state, metadata} = serverState.data || {}
  const {data} = useOtherRequiredDataQuery()
  const ctx = useMemo(
    () => ({
      config,
      state,
      data: {
        accountCreatedAt: metadata?.accountCreatedAt,
        declaredAge: data?.birthdate
          ? getAge(new Date(data.birthdate))
          : undefined,
        birthdate: data?.birthdate,
      },
    }),
    [config, state, data, metadata],
  )
  return (
    <AgeAssuranceDataContext.Provider value={ctx}>
      {children}
    </AgeAssuranceDataContext.Provider>
  )
}
