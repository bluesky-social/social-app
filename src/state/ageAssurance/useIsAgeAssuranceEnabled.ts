import {useMemo} from 'react'

import {useGate} from '#/lib/statsig/statsig'
import {useGeolocation} from '#/state/geolocation'

export function useIsAgeAssuranceEnabled() {
  const gate = useGate()
  const {geolocation} = useGeolocation()

  return useMemo(() => {
    const enabled = gate('age_assurance')
    return enabled && !!geolocation?.isAgeRestrictedGeo
  }, [geolocation, gate])
}
