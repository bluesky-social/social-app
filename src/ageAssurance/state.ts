import {useEffect, useMemo, useState} from 'react'
import {computeAgeAssuranceRegionAccess} from '@atproto/api'

import {useSession} from '#/state/session'
import {useAgeAssuranceDataContext} from '#/ageAssurance/data'
import {logger} from '#/ageAssurance/logger'
import {
  AgeAssuranceAccess,
  type AgeAssuranceState,
  AgeAssuranceStatus,
  parseAccessFromString,
  parseStatusFromString,
} from '#/ageAssurance/types'
import {getAgeAssuranceRegionConfigWithFallback} from '#/ageAssurance/util'
import {useGeolocation} from '#/geolocation'

export function useAgeAssuranceState(): AgeAssuranceState {
  const {hasSession} = useSession()
  const geolocation = useGeolocation()
  const {config, state, data} = useAgeAssuranceDataContext()

  return useMemo(() => {
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
        error: 'config',
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
     */
    const result = computeAgeAssuranceRegionAccess(region, data)
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
    logger.debug('debug useAgeAssuranceState', {
      region,
      state,
      data,
      computed,
    })
    return computed
  }, [hasSession, geolocation, config, state, data])
}

export function useOnAgeAssuranceAccessUpdate(
  cb: (state: AgeAssuranceState) => void,
) {
  const state = useAgeAssuranceState()
  // start with null to ensure callback is called on first render
  const [prevAccess, setPrevAccess] = useState<AgeAssuranceAccess | null>(null)

  useEffect(() => {
    if (prevAccess !== state.access) {
      setPrevAccess(state.access)
      cb(state)
      logger.debug(`useOnAgeAssuranceAccessUpdate`, {state})
    }
  }, [cb, state, prevAccess])
}
