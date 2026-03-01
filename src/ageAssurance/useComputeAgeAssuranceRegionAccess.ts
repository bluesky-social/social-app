import {useCallback} from 'react'
import {computeAgeAssuranceRegionAccess} from '@atproto/api'

import {useAgeAssuranceDataContext} from '#/ageAssurance/data'
import {logger} from '#/ageAssurance/logger'
import {AgeAssuranceAccess, parseAccessFromString} from '#/ageAssurance/types'
import {getAgeAssuranceRegionConfigWithFallback} from '#/ageAssurance/util'
import {type Geolocation} from '#/geolocation'

export function useComputeAgeAssuranceRegionAccess() {
  const {config, data} = useAgeAssuranceDataContext()
  return useCallback(
    (geolocation: Geolocation) => {
      if (!config) {
        logger.warn('useComputeAgeAssuranceRegionAccess: missing config')
        return AgeAssuranceAccess.Unknown
      }
      const region = getAgeAssuranceRegionConfigWithFallback(
        config,
        geolocation,
      )
      const result = computeAgeAssuranceRegionAccess(region, data)
      return result
        ? parseAccessFromString(result.access)
        : AgeAssuranceAccess.Full
    },
    [config, data],
  )
}
