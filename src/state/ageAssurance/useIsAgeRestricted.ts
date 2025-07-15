import {useMemo} from 'react'

import {useGate} from '#/lib/statsig/statsig'
import {useAgeAssuranceContext} from '#/state/ageAssurance'
import {useGeolocation} from '#/state/geolocation'

export function useIsAgeRestricted() {
  const {isReady, status} = useAgeAssuranceContext()
  const {geolocation} = useGeolocation()
  const gate = useGate()

  return useMemo(() => {
    if (!gate('age_assurance') || !geolocation?.isAgeRestrictedGeo) {
      return {
        isReady: true,
        isAgeRestricted: false,
      }
    }
    return {
      isReady,
      isAgeRestricted: status !== 'assured',
    }
  }, [isReady, status, geolocation, gate])
}
