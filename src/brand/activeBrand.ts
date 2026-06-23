import {type Brand} from './types'

let active: Brand | undefined

/**
 * Set the active brand. Must be called exactly once at app entry, before
 * any code that reads from a brand-driven module-level constant. Calling
 * twice with the same id is a no-op; calling with a different id throws.
 */
export function setActiveBrand(brand: Brand): void {
  if (active) {
    if (active.id === brand.id) return
    throw new Error(
      `setActiveBrand: already set to "${active.id}"; refusing to overwrite with "${brand.id}"`,
    )
  }
  active = brand
}

/**
 * Read the active brand. Throws if `setActiveBrand` has not yet run, which
 * surfaces wiring bugs immediately rather than letting them silently fall
 * back to a default.
 */
export function getActiveBrand(): Brand {
  if (!active) {
    throw new Error(
      'getActiveBrand: no brand set. Call setActiveBrand() at the app entry point.',
    )
  }
  return active
}

/**
 * For tests: reset the active brand. Not for production code.
 */
export function __resetActiveBrandForTests(): void {
  active = undefined
}
