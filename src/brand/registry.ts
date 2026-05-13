import bluesky from '../../brands/bluesky/brand'
import k4m2a from '../../brands/k4m2a/brand'
import {type Brand} from './types'

/**
 * The set of registered brands. Add a new brand by importing it here.
 * Keys must match the directory name under `brands/`.
 */
export const brands: Record<string, Brand> = {
  bluesky,
  k4m2a,
}

export const DEFAULT_BRAND_ID = 'bluesky'

export function getBrandById(id: string | undefined): Brand {
  if (id && brands[id]) return brands[id]
  return brands[DEFAULT_BRAND_ID]
}
