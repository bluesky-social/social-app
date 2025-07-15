import {useMemo} from 'react'

import {useGate} from '#/lib/statsig/statsig'
import {useGeolocation} from '#/state/geolocation'

export function useIsAgeAssuranceEnabled() {
  const gate = useGate()
  const {geolocation} = useGeolocation()

  return useMemo(() => {
    return gate('age_assurance') && !!geolocation?.isAgeRestrictedGeo
  }, [geolocation, gate])
}
