import {useEffect, useMemo, useState} from 'react'
import type * as AgeRange from 'expo-age-range'
import {
  type AppBskyAgeassuranceDefs,
  computeAgeAssuranceRegionAccess,
  getAgeAssuranceRegionConfig,
} from '@atproto/api'

import {getAge} from '#/lib/strings/time'
import {useSession} from '#/state/session'
import {
  getConfigFromCache,
  getDeviceSignalsFromCacheForRegion,
  getOtherRequiredDataFromCache,
  getServerStateFromCache,
  useAgeAssuranceServerDataContext,
} from '#/ageAssurance/data'
import {logger} from '#/ageAssurance/logger'
import {
  AgeAssuranceAccess,
  type AgeAssuranceMetadata,
  type AgeAssuranceState,
  AgeAssuranceStatus,
  parseAccessFromString,
  parseStatusFromString,
} from '#/ageAssurance/types'
import {
  computeAgeAssuranceFlags,
  getAgeAssuranceDataFromDeviceSignals,
  getAgeAssuranceRegionConfigWithFallback,
} from '#/ageAssurance/util'
import {type Geolocation, useGeolocation} from '#/geolocation'
import {device} from '#/storage'

/**
 * Get final evaluated age assurance state. Handles fallbacks and defers to
 * server state before computing access based on AA config from the server +
 * geolocation and other data.
 */
function computeAgeAssuranceState({
  hasSession,
  geolocation,
  config,
  state,
  metadata,
  deviceSignals,
}: {
  hasSession: boolean
  geolocation: Geolocation
  config?: AppBskyAgeassuranceDefs.Config
  state?: AppBskyAgeassuranceDefs.State
  metadata?: AgeAssuranceMetadata
  deviceSignals?: AgeRange.AgeRangeResponse
}) {
  /**
   * This is where we control logged-out moderation prefs. It's all
   * downstream of AA now.
   */
  if (!hasSession)
    return {
      status: AgeAssuranceStatus.Unknown,
      access: AgeAssuranceAccess.Safe,
    }

  /**
   * This can happen if the prefetch fails (such as due to network issues).
   * The query handler will try it again, but if it continues to fail, of
   * course we won't have config.
   *
   * In this case, fail open to avoid blocking users.
   */
  if (!config) {
    logger.warn('useAgeAssuranceState: missing config')
    return {
      status: AgeAssuranceStatus.Unknown,
      access: AgeAssuranceAccess.Safe,
      error: 'config' as const,
    }
  }

  const region = getAgeAssuranceRegionConfigWithFallback(config, geolocation)
  const isAARequired = region.countryCode !== '*'
  const isTerminalState =
    state?.status === 'assured' || state?.status === 'blocked'

  /*
   * If we are in a terminal state and AA is required for this region,
   * we can trust the server state completely and avoid recomputing.
   */
  if (isTerminalState && isAARequired) {
    return {
      lastInitiatedAt: state.lastInitiatedAt,
      status: parseStatusFromString(state.status),
      access: parseAccessFromString(state.access),
    }
  }

  /*
   * Otherwise, we need to compute the access based on the latest data. For
   * accounts with an accurate birthdate, our default fallback rules should
   * ensure correct access.
   *
   * In regions that permit on-device verification, the OS-provided age range
   * is treated as an assured age and fed into the rule engine, where it
   * matches `IfAssuredOverAge`/`IfAssuredUnderAge` rules.
   */
  const {assuredAge} = getAgeAssuranceDataFromDeviceSignals(
    region,
    deviceSignals,
  )
  const result = computeAgeAssuranceRegionAccess(region, {
    accountCreatedAt: metadata?.accountCreatedAt,
    declaredAge: metadata?.declaredAge,
    assuredAge,
  })
  const computed = {
    lastInitiatedAt: state?.lastInitiatedAt,
    // prefer server state
    status: state?.status
      ? parseStatusFromString(state?.status)
      : AgeAssuranceStatus.Unknown,
    // prefer server state
    access: result
      ? parseAccessFromString(result.access)
      : AgeAssuranceAccess.Full,
  }
  logger.debug('computeAgeAssuranceState', {
    region,
    state,
    metadata,
    computed,
  })
  return computed
}

/**
 * This is a last-ditch helper for out-of-band reads of the AA state, such as
 * during account creation. Don't use it for anything else.
 */
export function unsafeGetAndComputeAgeAssurance({did}: {did: string}) {
  const config = getConfigFromCache()
  const state = getServerStateFromCache({did})
  const requiredData = getOtherRequiredDataFromCache({did})
  const geolocation = device.get(['mergedGeolocation'])

  if (!geolocation || !config || !state || !requiredData) {
    return {
      state: {
        status: AgeAssuranceStatus.Unknown,
        access: AgeAssuranceAccess.Safe,
      },
    }
  }

  const region = getAgeAssuranceRegionConfigWithFallback(config, geolocation)
  /*
   * Device signals are keyed off the matched config region (no fallback): if
   * geolocation matches no AA region there's no device grant to read, so we
   * skip the lookup rather than keying off FALLBACK_REGION_CONFIG. This keeps
   * the read key symmetric with the write (see `setDeviceSignalsForRegion`).
   */
  const deviceRegion = getAgeAssuranceRegionConfig(config, {
    countryCode: geolocation.countryCode ?? '',
    regionCode: geolocation.regionCode,
  })
  const deviceSignals = deviceRegion
    ? getDeviceSignalsFromCacheForRegion({did, region: deviceRegion})
    : undefined
  const metadata: AgeAssuranceMetadata = {
    accountCreatedAt: state.metadata?.accountCreatedAt,
    declaredAge: requiredData?.birthdate
      ? getAge(new Date(requiredData.birthdate))
      : undefined,
    birthdate: requiredData?.birthdate,
  }
  const computed = computeAgeAssuranceState({
    hasSession: true,
    config,
    geolocation,
    state: state.state,
    metadata,
    deviceSignals,
  })

  return {
    state: computed,
    flags: computeAgeAssuranceFlags({
      state: computed,
      regionConfig: region,
      metadata,
    }),
  }
}

export function useAgeAssuranceState(): AgeAssuranceState {
  const {hasSession} = useSession()
  const geolocation = useGeolocation()
  const {config, state, metadata, deviceSignals} =
    useAgeAssuranceServerDataContext()

  return useMemo(
    () =>
      computeAgeAssuranceState({
        hasSession,
        config,
        geolocation,
        state,
        metadata,
        deviceSignals,
      }),
    [hasSession, geolocation, config, state, metadata, deviceSignals],
  )
}

export function useOnAgeAssuranceAccessUpdate(
  cb: (state: AgeAssuranceState) => void,
) {
  const state = useAgeAssuranceState()
  // start with null to ensure callback is called on first render
  const [prevAccess, setPrevAccess] = useState<AgeAssuranceAccess | null>(null)

  useEffect(() => {
    if (prevAccess !== state.access) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPrevAccess(state.access)
      cb(state)
      logger.debug(`useOnAgeAssuranceAccessUpdate`, {state})
    }
  }, [cb, state, prevAccess])
}
