import bluesky from '../../brands/bluesky/brand'
import coseeker from '../../brands/coseeker/brand'
import k4m2a from '../../brands/k4m2a/brand'
import mdparivaar from '../../brands/mdparivaar/brand'
import {type Brand} from './types'

/**
 * The set of registered brands. Add a new brand by importing it here.
 * Keys must match the directory name under `brands/`.
 */
export const brands: Record<string, Brand> = {
  bluesky,
  coseeker,
  k4m2a,
  mdparivaar,
}

export const DEFAULT_BRAND_ID = 'coseeker'

export function getBrandById(id: string | undefined): Brand {
  if (id && brands[id]) return brands[id]
  return brands[DEFAULT_BRAND_ID]
}
