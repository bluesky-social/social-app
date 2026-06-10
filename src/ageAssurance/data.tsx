import {createContext, useCallback, useContext, useEffect, useMemo} from 'react'
import {
  type AppBskyAgeassuranceDefs,
  type AppBskyAgeassuranceGetConfig,
  type AppBskyAgeassuranceGetState,
  AtpAgent,
  type ChatBskyActorDeclaration,
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
import {fetchActorDeclarationRecord} from '#/state/queries/messages/actor-declaration'
import {useAgent, useSession} from '#/state/session'
import * as debug from '#/ageAssurance/debug'
import {logger} from '#/ageAssurance/logger'
import {birthdateFromFlags, getMuAgeStatus} from '#/ageAssurance/muAgeService'
import {type AgeAssuranceMetadata} from '#/ageAssurance/types'
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

export function getDidFromAgentSession(agent: AtpAgent) {
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
export function prefetchConfig() {
  if (configPrefetchPromise) {
    logger.debug(`prefetchAgeAssuranceConfig: already in progress`)
    return
  }

  configPrefetchPromise = (async () => {
    await cacheHydrationPromise
    const cached = getConfigFromCache()

    if (cached) {
      logger.debug(`prefetchAgeAssuranceConfig: using cache`)
    } else {
      try {
        logger.debug(`prefetchAgeAssuranceConfig: resolving...`)
        const res = await networkRetry(3, () => getConfig())
        qc.setQueryData<AppBskyAgeassuranceGetConfig.OutputSchema>(
          configQueryKey,
          res,
        )
      } catch (err) {
        const e = err as Error
        logger.warn(`prefetchAgeAssuranceConfig: failed`, {
          safeMessage: e.message,
        })
      }
    }
  })()
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
    return null
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
    if (res) {
      qc.setQueryData<AppBskyAgeassuranceGetState.OutputSchema>(qk, res)
    }
  } catch (err) {
    const e = err as Error
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
  if (res) {
    qc.setQueryData<AppBskyAgeassuranceGetState.OutputSchema>(
      createServerStateQueryKey({did}),
      res,
    )
  }
  return res
}
export function usePatchServerState() {
  const {currentAccount} = useSession()
  return useCallback(
    (next: AppBskyAgeassuranceDefs.State) => {
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

      void refetch()
    })
  }, [did, refetch, isAssured])

  return query
}

/*
 * Other required data
 */

export type OtherRequiredData = {
  birthdate: string | undefined
  actorDeclaration?: ChatBskyActorDeclaration.Main
}
export function createOtherRequiredDataQueryKey({did}: {did: string}) {
  return ['otherRequiredData', did]
}
async function getOtherRequiredData({
  agent,
}: {
  agent: AtpAgent
}): Promise<OtherRequiredData> {
  if (debug.enabled) return debug.resolve(debug.otherRequiredData)
  const did = getDidFromAgentSession(agent)

  /**
   * mu fork: the declared age comes from our own backend (mu-age-service),
   * uniformly across OAuth and app-password sessions. It stores only boolean
   * threshold flags, so we rebuild a representative birthdate for the region
   * rule engine. `birthdate` undefined === the user has not declared yet, which
   * gates them into the one-time birthdate prompt (see computeAgeAssuranceState
   * + NoAccessScreen). We no longer read app.bsky preferences here.
   */
  const [status, actorDeclaration] = await Promise.all([
    getMuAgeStatus(agent),
    fetchActorDeclarationRecord({did, agent}),
  ])
  const data: OtherRequiredData = {
    birthdate: status.declared
      ? birthdateFromFlags({
          over13: !!status.over13,
          over16: !!status.over16,
          over18: !!status.over18,
        })
      : undefined,
    actorDeclaration,
  }

  if (did && birthdateCache.has(did)) {
    /*
     * If a declaration was just set, use the local cache value. On subsequent
     * reloads, the backend returns the correct value.
     */
    data.birthdate = birthdateCache.get(did)
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
export function setOtherRequiredDataActorDeclarationCache({
  did,
  actorDeclaration,
}: {
  did: string
  actorDeclaration: ChatBskyActorDeclaration.Main
}) {
  const prev = getOtherRequiredDataFromCache({did})
  const next: OtherRequiredData = {
    birthdate: prev?.birthdate,
    actorDeclaration: {
      ...(prev?.actorDeclaration || {}),
      ...actorDeclaration,
    },
  }
  qc.setQueryData<OtherRequiredData>(
    createOtherRequiredDataQueryKey({did}),
    next,
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
  } catch (err) {
    const e = err as Error
    logger.warn(`prefetchOtherRequiredData: failed`, {
      safeMessage: e.message,
    })
  }
}
export function usePatchOtherRequiredData() {
  const {currentAccount} = useSession()
  return useCallback(
    (next: OtherRequiredData) => {
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
      /**
       * mu fork: the declared age comes from our own backend and changes ~never,
       * so treat it as fresh for 7 days (5s in dev for easy testing). Avoids
       * re-minting a service-auth token + hitting the backend on every window
       * focus; the persisted cache still serves it instantly on cold start, and
       * a declaration optimistically patches the cache so the gate lifts without
       * waiting for a refetch.
       */
      staleTime: IS_DEV ? 5e3 : 1000 * 60 * 60 * 24 * 7,
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
 * Helper to prefetch all age assurance data from the server.
 */
export function prefetchAgeAssuranceServerData({agent}: {agent: AtpAgent}) {
  return Promise.allSettled([
    // config fetch initiated at the top of the App.platform.tsx files, awaited here
    configPrefetchPromise,
    prefetchServerState({agent}),
    prefetchOtherRequiredData({agent}),
  ])
}

export function clearAgeAssuranceServerDataForDid({did}: {did: string}) {
  logger.debug(`clearAgeAssuranceServerDataForDid: ${did}`)
  qc.removeQueries({queryKey: createServerStateQueryKey({did}), exact: true})
  qc.removeQueries({
    queryKey: createOtherRequiredDataQueryKey({did}),
    exact: true,
  })
}

export function clearAgeAssuranceServerDataForAll() {
  logger.debug(`clearAgeAssuranceServerDataForAll`)
  qc.clear()
}

/*
 * Context
 */

export type AgeAssuranceServerData = {
  /**
   * The raw config from the appview.
   */
  config: AppBskyAgeassuranceDefs.Config | undefined
  /**
   * The raw state from the appview. Must be further processed before being useful.
   */
  state: AppBskyAgeassuranceDefs.State | undefined
  metadata: AgeAssuranceMetadata | undefined
}
const AgeAssuranceServerDataContext = createContext<AgeAssuranceServerData>({
  config: undefined,
  state: undefined,
  metadata: {
    accountCreatedAt: undefined,
    declaredAge: undefined,
    birthdate: undefined,
  },
})
export function useAgeAssuranceServerDataContext() {
  return useContext(AgeAssuranceServerDataContext)
}
export function AgeAssuranceServerDataProvider({
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
      metadata: {
        // yes, it's weird, but accountCreatedAt comes back on the `getState` endpoint
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
    <AgeAssuranceServerDataContext.Provider value={ctx}>
      {children}
    </AgeAssuranceServerDataContext.Provider>
  )
}
