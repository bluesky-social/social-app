import {createContext, useCallback, useContext, useEffect, useMemo} from 'react'
import * as AgeRange from 'expo-age-range'
import {Client} from '@atproto/lex-client'
import {getPreferences} from '@bsky.app/sdk'
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
import {fetchActorDeclarationRecord} from '#/state/queries/messages/actor-declaration'
import {useAppviewClient, usePdsClient, useSession} from '#/state/session'
import {DEVICE_SIGNALS_SUPPORTED} from '#/ageAssurance/const'
import * as debug from '#/ageAssurance/debug'
import {logger} from '#/ageAssurance/logger'
import {
  type AgeAssuranceDeviceSignals,
  type AgeAssuranceMetadata,
} from '#/ageAssurance/types'
import {
  createRegionKey,
  getAgeAssuranceRegionConfigForGeolocation,
  getBirthdateStringFromAge,
  isLegacyBirthdateBug,
} from '#/ageAssurance/util'
import {IS_DEV} from '#/env'
import {useGeolocation} from '#/geolocation'
import {app, type chat} from '#/lexicons'
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

/**
 * Reads the active account did from a lex {@link Client}. Logged-out clients
 * expose `did: undefined`, so this returns undefined in that case.
 */
export function getDidFromClient(client: Client) {
  return client.did
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
  const client = new Client({
    service: PUBLIC_BSKY_SERVICE,
  })
  return await client.call(app.bsky.ageassurance.getConfig)
}
export function getConfigFromCache():
  | app.bsky.ageassurance.getConfig.$OutputBody
  | undefined {
  return qc.getQueryData<app.bsky.ageassurance.getConfig.$OutputBody>(
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
        qc.setQueryData<app.bsky.ageassurance.getConfig.$OutputBody>(
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
  qc.setQueryData<app.bsky.ageassurance.getConfig.$OutputBody>(
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
export async function getServerState({
  appviewClient,
}: {
  appviewClient: Client
}): Promise<app.bsky.ageassurance.getState.$OutputBody | null> {
  if (debug.enabled && debug.serverState)
    return debug.resolve(debug.serverState)
  const geolocation = device.get(['mergedGeolocation'])
  if (!geolocation || !geolocation.countryCode) {
    logger.error(`getServerState: missing geolocation countryCode`)
    return null
  }
  const data = await appviewClient.call(app.bsky.ageassurance.getState, {
    countryCode: geolocation.countryCode,
    regionCode: geolocation.regionCode,
  })
  const did = getDidFromClient(appviewClient)
  if (data && did && createdAtCache.has(did)) {
    /*
     * If account was just created, just use the local cache if available. On
     * subsequent reloads, the server should have the correct value. The cache
     * holds ISO datetime strings (written from `new Date().toISOString()`), so
     * assert the branded DatetimeString at this boundary.
     */
    data.metadata.accountCreatedAt = createdAtCache.get(
      did,
    ) as typeof data.metadata.accountCreatedAt
  }
  return data ?? null
}
export function getServerStateFromCache({
  did,
}: {
  did: string
}): app.bsky.ageassurance.getState.$OutputBody | undefined {
  return qc.getQueryData<app.bsky.ageassurance.getState.$OutputBody>(
    createServerStateQueryKey({did}),
  )
}
export async function prefetchServerState({
  appviewClient,
}: {
  appviewClient: Client
}) {
  const did = getDidFromClient(appviewClient)

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
    const res = await networkRetry(3, () => getServerState({appviewClient}))
    if (res) {
      qc.setQueryData<app.bsky.ageassurance.getState.$OutputBody>(qk, res)
    }
  } catch (err) {
    const e = err as Error
    logger.warn(`prefetchServerState: failed`, {
      safeMessage: e.message,
    })
  }
}
export async function refetchServerState({
  appviewClient,
}: {
  appviewClient: Client
}) {
  const did = getDidFromClient(appviewClient)
  if (!did) return
  logger.debug(`refetchServerState: fetching...`)
  const res = await networkRetry(3, () => getServerState({appviewClient}))
  if (res) {
    qc.setQueryData<app.bsky.ageassurance.getState.$OutputBody>(
      createServerStateQueryKey({did}),
      res,
    )
  }
  return res
}
export function usePatchServerState() {
  const {currentAccount} = useSession()
  return useCallback(
    (next: app.bsky.ageassurance.defs.State) => {
      if (!currentAccount) return
      const did = currentAccount.did
      const prev = getServerStateFromCache({did})
      const merged: app.bsky.ageassurance.getState.$OutputBody = {
        metadata: {},
        ...(prev || {}),
        state: next,
      }
      qc.setQueryData<app.bsky.ageassurance.getState.$OutputBody>(
        createServerStateQueryKey({did}),
        merged,
      )
    },
    [currentAccount],
  )
}
export function useServerStateQuery() {
  const appviewClient = useAppviewClient()
  const did = getDidFromClient(appviewClient)
  const query = useQuery(
    {
      enabled: !!did,
      initialData: () => {
        if (!did) return
        return getServerStateFromCache({did})
      },
      queryKey: createServerStateQueryKey({did: did!}),
      async queryFn() {
        return getServerState({appviewClient})
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
        getAgeAssuranceRegionConfigForGeolocation(config, geolocation),
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
  actorDeclaration?: chat.bsky.actor.declaration.Main
}
export function createOtherRequiredDataQueryKey({did}: {did: string}) {
  return ['otherRequiredData', did]
}
async function getOtherRequiredData({
  accountClient,
}: {
  accountClient: Client
}): Promise<OtherRequiredData> {
  if (debug.enabled) return debug.resolve(debug.otherRequiredData)
  const did = getDidFromClient(accountClient)
  const [prefs, actorDeclaration] = await Promise.all([
    accountClient.call(getPreferences),
    fetchActorDeclarationRecord({did, client: accountClient}),
  ])
  const data: OtherRequiredData = {
    birthdate: prefs.birthDate ? prefs.birthDate.toISOString() : undefined,
    actorDeclaration,
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
export function setOtherRequiredDataActorDeclarationCache({
  did,
  actorDeclaration,
}: {
  did: string
  actorDeclaration: chat.bsky.actor.declaration.Main
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
export async function prefetchOtherRequiredData({
  accountClient,
}: {
  accountClient: Client
}) {
  const did = getDidFromClient(accountClient)

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
    const res = await networkRetry(3, () =>
      getOtherRequiredData({accountClient}),
    )
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
  const accountClient = usePdsClient()
  const did = getDidFromClient(accountClient)
  return useQuery(
    {
      enabled: !!did,
      initialData: () => {
        if (!did) return
        return getOtherRequiredDataFromCache({did})
      },
      queryKey: createOtherRequiredDataQueryKey({did: did!}),
      async queryFn() {
        return getOtherRequiredData({accountClient})
      },
    },
    qc,
  )
}

export function createDeviceSignalsQueryKey({did}: {did: string}) {
  return ['device-signals', did]
}
/**
 * Prompts the native OS age API. Returns the raw response, or undefined if the
 * platform can't provide one.
 *
 * Native-only: on web `expo-age-range` returns a misleading default (e.g.
 * `{lowerBound: 18}`), so we never call it there — web users fall back to KWS.
 *
 * If this method throws for whatever reason, we catch and log the error and
 * return undefined. The caller should treat undefined as "no device signals
 * available" and fall back to KWS.
 */
export async function getDeviceSignals(): Promise<
  AgeRange.AgeRangeResponse | undefined
> {
  if (debug.enabled && debug.useMockDeviceSignalsAPIResponse)
    return debug.resolve(debug.deviceSignals)
  if (!DEVICE_SIGNALS_SUPPORTED) return undefined
  try {
    return await AgeRange.requestAgeRangeAsync({
      threshold1: 13,
      threshold2: 16,
      threshold3: 18,
    })
  } catch (err) {
    const e = err as Error
    logger.error(`getDeviceSignals: failed to get device signals`, {
      safeMessage: e.message,
    })
    return undefined
  }
}
/**
 * The raw region-keyed map of device signals (all regions). Used internally by
 * the query + writer, which operate on the full map. Most consumers want
 * {@link getDeviceSignalsFromCacheForRegion}, which resolves to the
 * current region.
 */
export function getDeviceSignalsMapFromCache({
  did,
}: {
  did: string
}): AgeAssuranceDeviceSignals | undefined {
  return qc.getQueryData<AgeAssuranceDeviceSignals>(
    createDeviceSignalsQueryKey({did}),
  )
}
/**
 * Returns the device signals for the region the user is currently in, or
 * undefined.
 */
export function getDeviceSignalsFromCacheForRegion({
  did,
  region,
}: {
  did: string
  region: app.bsky.ageassurance.defs.ConfigRegion
}): AgeRange.AgeRangeResponse | undefined {
  const regionKey = createRegionKey(region)
  return getDeviceSignalsMapFromCache({did})?.[regionKey]
}
/**
 * Stores freshly granted device signals into the (persisted) cache under the
 * region they were captured in, merging with any signals already stored for
 * other regions. Notifies the disabled `useDeviceSignalsQuery` observer so the
 * AA state recomputes.
 *
 * Device assurance is client-side only (it can't be verified server-side) and
 * region-bound — keying by region is what binds it. See
 * {@link AgeAssuranceDeviceSignals}.
 */
export function setDeviceSignalsForRegion({
  did,
  region,
  signals,
}: {
  did: string
  region: {countryCode: string; regionCode?: string}
  signals: AgeRange.AgeRangeResponse
}) {
  const regionKey = createRegionKey(region)
  qc.setQueryData<AgeAssuranceDeviceSignals | undefined>(
    createDeviceSignalsQueryKey({did}),
    prev => ({...prev, [regionKey]: signals}),
  )
}
export async function prefetchDeviceSignals({
  appviewClient,
}: {
  appviewClient: Client
}) {
  const did = getDidFromClient(appviewClient)
  if (!did) return

  /**
   * Device signals are restored from the persisted cache only — we never call
   * the native age API during prefetch, since that would prompt the OS for
   * users who haven't opted in. Awaiting cache hydration ensures any previously
   * granted signals are available before the AA state is first computed. The
   * user can (re)grant access later via the NoAccessScreen verify flow.
   */
  await cacheHydrationPromise
  const cached = getDeviceSignalsMapFromCache({did})
  logger.debug(
    `prefetchDeviceSignals: ${cached ? 'restored from cache' : 'no cache'}`,
    cached,
  )

  /*
   * Future silent-refresh path (intentionally left commented out). The OS
   * returns a previously granted age range without re-prompting, so once a
   * region is already cached we could refresh it on load instead of waiting for
   * the user to re-verify. We don't do this yet because the native call can
   * still surface a prompt for users who never opted in, so it must stay gated
   * behind an explicit grant for now.
   *
   * const geolocation = device.get(['mergedGeolocation'])
   * if (cached && geolocation?.countryCode) {
   *   const signals = await getDeviceSignals()
   *   if (signals) {
   *     setDeviceSignalsForRegion({did, region: geolocation, signals})
   *   }
   * }
   */
}
export function useDeviceSignalsQuery() {
  const appviewClient = useAppviewClient()
  const did = getDidFromClient(appviewClient)
  const {data: config} = useConfigQuery()
  const geolocation = useGeolocation()
  /*
   * Resolve the matched config region (no fallback) and key off it, so the read
   * stays symmetric with the write (see `setDeviceSignalsForRegion`). When
   * geolocation matches no AA region there's no device grant to surface.
   */
  const regionConfig = config
    ? getAgeAssuranceRegionConfigForGeolocation(config, geolocation)
    : undefined
  const regionKey = regionConfig ? createRegionKey(regionConfig) : undefined

  return useQuery(
    {
      /**
       * Disabled so we never auto-call the native age API on load — that would
       * prompt the OS for every logged-in user. We restore from the persisted
       * cache (via `initialData`) and otherwise only update reactively when the
       * user explicitly verifies (see `getDeviceSignals` +
       * `setDeviceSignalsForRegion` in the NoAccessScreen verify flow).
       *
       * A future enhancement could silently refresh here when already cached,
       * since the OS returns the granted result without re-prompting.
       */
      enabled: false,
      initialData: getDeviceSignalsMapFromCache({did: did!}),
      queryKey: createDeviceSignalsQueryKey({did: did!}),
      queryFn() {
        // Never auto-fetches (see `enabled: false`); the verify flow writes the
        // region-keyed signals directly via `setDeviceSignalsForRegion`.
        return getDeviceSignalsMapFromCache({did: did!})
      },
      // The cache holds the full region-keyed map (the writer merges into it);
      // `select` resolves it to the current region for consumers without
      // mutating the cached value.
      select: map => (map && regionKey ? map[regionKey] : undefined),
    },
    qc,
  )
}

/**
 * Helper to prefetch all age assurance data from the server. Reads that hit
 * the appview (`getState`, device signals) take the appview client; the
 * preferences/actor-declaration read hits the PDS via the account client.
 */
export function prefetchAgeAssuranceServerData({
  appviewClient,
  accountClient,
}: {
  appviewClient: Client
  accountClient: Client
}) {
  return Promise.allSettled([
    // config fetch initiated at the top of the App.platform.tsx files, awaited here
    configPrefetchPromise,
    prefetchServerState({appviewClient}),
    prefetchOtherRequiredData({accountClient}),
    prefetchDeviceSignals({appviewClient}),
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
  config: app.bsky.ageassurance.defs.Config | undefined
  /**
   * The raw state from the appview. Must be further processed before being useful.
   */
  state: app.bsky.ageassurance.defs.State | undefined
  metadata: AgeAssuranceMetadata | undefined
  /**
   * The native on-device age signals for the region the user is currently in,
   * if they've granted access there. Already resolved from the region-keyed
   * cache (see `getDeviceSignalsFromCacheForRegion`), so a grant from
   * another region won't appear here. Only consumed for regions that permit
   * device verification.
   */
  deviceSignals: AgeRange.AgeRangeResponse | undefined
}
const AgeAssuranceServerDataContext = createContext<AgeAssuranceServerData>({
  config: undefined,
  state: undefined,
  metadata: {
    accountCreatedAt: undefined,
    declaredAge: undefined,
    birthdate: undefined,
  },
  deviceSignals: undefined,
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
  // `select` resolves the cached region-keyed map to the current region.
  const {data: deviceSignals} = useDeviceSignalsQuery()
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
      deviceSignals,
    }),
    [config, state, data, metadata, deviceSignals],
  )
  return (
    <AgeAssuranceServerDataContext.Provider value={ctx}>
      {children}
    </AgeAssuranceServerDataContext.Provider>
  )
}
