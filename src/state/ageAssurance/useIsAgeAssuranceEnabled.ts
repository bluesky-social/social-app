import {useMemo} from 'react'

import {useGeolocation} from '#/state/geolocation'

export function useIsAgeAssuranceEnabled() {
  const {geolocation} = useGeolocation()

  return useMemo(() => {
    return !!geolocation?.isAgeRestrictedGeo
  }, [geolocation])
}
