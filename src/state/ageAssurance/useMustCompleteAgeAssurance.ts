import {useMemo} from 'react'

import {useGate} from '#/lib/statsig/statsig'
import {useAgeAssuranceContext} from '#/state/ageAssurance'
import {useGeolocation} from '#/state/geolocation'

export function useMustCompleteAgeAssurance() {
  const gate = useGate()
  const {geolocation} = useGeolocation()
  const {isLoaded, status: ageAssuranceStatus} = useAgeAssuranceContext()
  return useMemo(() => {
    if (!gate('age_assurance')) return false
    if (!geolocation?.isAgeRestrictedGeo) return false
    if (!isLoaded) return false
    return ageAssuranceStatus !== 'assured'
  }, [isLoaded, gate, geolocation, ageAssuranceStatus])
}
