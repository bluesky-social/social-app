import {DEFAULT_BRAND_ID, getBrandById} from './registry'
import {type Brand} from './types'

/**
 * Native: brand is baked in at build time via EXPO_PUBLIC_BRAND. Expo's
 * babel plugin inlines EXPO_PUBLIC_* env vars at bundle time, so this is a
 * compile-time constant in the native bundle.
 */
export function resolveBrand(): Brand {
  const id = process.env.EXPO_PUBLIC_BRAND ?? DEFAULT_BRAND_ID
  return getBrandById(id)
}
