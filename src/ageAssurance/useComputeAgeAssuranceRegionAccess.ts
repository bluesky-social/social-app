import {useCallback} from 'react'
import {computeAgeAssuranceRegionAccess} from '@bsky.app/sdk/utils'

import {useAgeAssuranceServerDataContext} from '#/ageAssurance/data'
import {logger} from '#/ageAssurance/logger'
import {AgeAssuranceAccess, parseAccessFromString} from '#/ageAssurance/types'
import {getAgeAssuranceRegionConfigWithFallback} from '#/ageAssurance/util'
import {type Geolocation} from '#/geolocation'

export function useComputeAgeAssuranceRegionAccess() {
  const {config, metadata} = useAgeAssuranceServerDataContext()
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
      const result = computeAgeAssuranceRegionAccess(region, {
        accountCreatedAt: metadata?.accountCreatedAt,
        declaredAge: metadata?.declaredAge,
      })
      return result
        ? parseAccessFromString(result.access)
        : AgeAssuranceAccess.Full
    },
    [config, metadata],
  )
}
