import {DEFAULT_BRAND_CONFIG} from '#/lib/community/BrandContext'
import {type ComputedBrandConfig} from '#/lib/community/types'
import {LATINSKY_BRAND_SLUG, LATINSKY_HANDLE_SUFFIXES} from '#/lib/constants'
import {BRAND_SERVICE_URL} from '#/env'

/**
 * Minimal shape of a stored account needed to resolve its community brand.
 * Kept local (rather than importing SessionAccount) so this module stays a pure,
 * testable leaf with no session dependency.
 */
export interface ResolvableAccount {
  /** The account's PDS URL, e.g. `https://blacksky.app`. */
  pdsUrl?: string
  /** The account's handle, e.g. `alice.latinsky.app`. */
  handle?: string
  /** Community slug stamped on the account at signup (deterministic fast path). */
  communitySlug?: string
}

/**
 * Normalize a host or URL for equality comparison: lowercase, drop the scheme,
 * any path/query, the port, and a trailing dot. Mirrors the server-side
 * `normalize_host` in acorn/brand so both sides agree on what "same host" means.
 */
export function normalizeHost(input: string): string {
  let s = input.trim()
  const scheme = s.indexOf('://')
  if (scheme !== -1) s = s.slice(scheme + 3)
  s = s.split('/')[0]
  s = s.split('?')[0]
  s = s.split(':')[0]
  return s.replace(/\.+$/, '').toLowerCase()
}

async function fetchResolvedConfig(
  query: string,
): Promise<ComputedBrandConfig | null> {
  try {
    const res = await fetch(`${BRAND_SERVICE_URL}/brands/resolve?${query}`, {
      headers: {accept: 'application/json'},
    })
    if (!res.ok) return null
    const data = (await res.json()) as {computed?: ComputedBrandConfig}
    return data.computed ?? null
  } catch {
    return null
  }
}

/** Summary of a published brand, as returned by the brand service `GET /brands`. */
export interface BrandListEntry {
  slug: string
  name: string
  displayName: string
  themeColor: string
  logo: string
  description: string
  /** The community's PDS URL — signup points at this when the community is picked. */
  pds: string
}

/**
 * List published communities (for the signup community picker). Returns an empty
 * array when the service is unreachable so callers can fall back to a
 * Blacksky-only default.
 */
export async function fetchBrandList(): Promise<BrandListEntry[]> {
  try {
    const res = await fetch(`${BRAND_SERVICE_URL}/brands`, {
      headers: {accept: 'application/json'},
    })
    if (!res.ok) return []
    const data = (await res.json()) as {brands?: BrandListEntry[]}
    return data.brands ?? []
  } catch {
    return []
  }
}

/** Resolve a brand's computed config by community slug. */
export function fetchBrandBySlug(
  slug: string,
): Promise<ComputedBrandConfig | null> {
  return fetchResolvedConfig(`slug=${encodeURIComponent(slug)}`)
}

/** Resolve a brand's computed config by the account's PDS host. */
export function resolveBrandForPds(
  pdsUrl: string,
): Promise<ComputedBrandConfig | null> {
  return fetchResolvedConfig(`pds=${encodeURIComponent(normalizeHost(pdsUrl))}`)
}

// The default community (Blacksky) owns/shares this PDS and its config is bundled
// into the app, so the host is taken from the default brand config rather than a
// separate constant — single source of truth for "the default community's PDS".
function isBlackskyPds(pdsUrl: string | undefined): boolean {
  if (!pdsUrl) return false
  return (
    normalizeHost(pdsUrl) ===
    normalizeHost(DEFAULT_BRAND_CONFIG.services.pds.url)
  )
}

function isLatinskyHandle(handle: string | undefined): boolean {
  if (!handle) return false
  const h = handle.toLowerCase()
  return LATINSKY_HANDLE_SUFFIXES.some(suffix => h.endsWith(suffix))
}

/**
 * Resolve the community brand config for an account. Resolution order:
 *   1. `communitySlug` stamped at signup — deterministic, and required to
 *      disambiguate communities that share a PDS.
 *   2. The Blacksky PDS is the default/shared PDS and is never resolved by PDS:
 *      - a Latinsky handle on it → Latinsky (the handle carveout);
 *      - anything else → null (the bundled Blacksky default). Blacksky itself
 *        has no brand-service config by design.
 *   3. Any other PDS host → brand (the general case).
 * Returns `null` when nothing matches or the service is unreachable; callers
 * fall back to the bundled Blacksky default.
 */
export async function resolveBrandForAccount(
  account: ResolvableAccount,
): Promise<ComputedBrandConfig | null> {
  if (account.communitySlug) {
    return fetchBrandBySlug(account.communitySlug)
  }
  if (isBlackskyPds(account.pdsUrl)) {
    // Shared/default PDS — not PDS-resolvable. Latinsky is identified by handle;
    // a plain Blacksky account falls through to the bundled default.
    if (isLatinskyHandle(account.handle)) {
      return fetchBrandBySlug(LATINSKY_BRAND_SLUG)
    }
    return null
  }
  if (account.pdsUrl) {
    return resolveBrandForPds(account.pdsUrl)
  }
  return null
}
