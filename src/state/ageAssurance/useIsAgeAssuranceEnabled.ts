import {useMemo} from 'react'

import {useGeolocationStatus} from '#/state/geolocation'

export function useIsAgeAssuranceEnabled() {
  const {status: geolocation} = useGeolocationStatus()

  return useMemo(() => {
    return !!geolocation?.isAgeRestrictedGeo
  }, [geolocation])
}
