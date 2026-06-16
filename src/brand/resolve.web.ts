import {DEFAULT_BRAND_ID, getBrandById} from './registry'
import {type Brand} from './types'

/**
 * Map a hostname to a brand id. Add deployment hostnames here as new
 * communities come online. Subdomains and root domains are matched
 * verbatim; anything not listed falls back to the default brand.
 */
const HOSTNAME_TO_BRAND_ID: Record<string, string> = {
  'k4m2a.app': 'k4m2a',
  'www.k4m2a.app': 'k4m2a',
  'mdparivaar.com': 'mdparivaar',
  'www.mdparivaar.com': 'mdparivaar',
  'coseeker.com': 'coseeker',
  'www.coseeker.com': 'coseeker',
}

/**
 * Web: brand is resolved at boot from `window.location.hostname`. Build-time
 * EXPO_PUBLIC_BRAND is honored as an override when present (useful for
 * single-tenant web deploys and for `yarn web` local dev).
 */
export function resolveBrand(): Brand {
  const envOverride = process.env.EXPO_PUBLIC_BRAND
  if (envOverride) return getBrandById(envOverride)

  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  const id = HOSTNAME_TO_BRAND_ID[hostname] ?? DEFAULT_BRAND_ID
  return getBrandById(id)
}
