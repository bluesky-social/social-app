/**
 * Pure helpers for resolving a Bluesky handle to its hosting provider (PDS).
 * Network-agnostic — `resolvePdsFromHandle` (in `state/queries/pds-from-handle`)
 * composes these with an `@atproto/api` Agent.
 */

const PLC_DIRECTORY = 'https://plc.directory'

export type DidService = {
  id: string
  type: string
  serviceEndpoint: string
}

export type DidDocument = {
  service?: DidService[]
}

/**
 * Extract the AtprotoPersonalDataServer endpoint from a DID document.
 *
 * The service fragment is always `#atproto_pds`; the full id may be prefixed
 * with the DID (e.g. `did:plc:xxx#atproto_pds`) so we match the suffix.
 */
export function extractPdsEndpoint(doc: DidDocument): string | null {
  if (!doc.service) return null
  for (const svc of doc.service) {
    if (!svc || typeof svc !== 'object') continue
    const isPdsId =
      svc.id === '#atproto_pds' || svc.id?.endsWith('#atproto_pds')
    const isPdsType = svc.type === 'AtprotoPersonalDataServer'
    if (isPdsId && isPdsType && typeof svc.serviceEndpoint === 'string') {
      return svc.serviceEndpoint
    }
  }
  return null
}

/**
 * Build the URL where a DID's document is served.
 *   - did:plc -> plc.directory
 *   - did:web -> /.well-known/did.json on the encoded host (and optional path)
 *
 * Returns null for unknown DID methods.
 */
export function didDocumentUrl(did: string): string | null {
  if (did.startsWith('did:plc:')) {
    return `${PLC_DIRECTORY}/${did}`
  }
  if (did.startsWith('did:web:')) {
    const rest = did.slice('did:web:'.length)
    const [hostEncoded, ...pathSegments] = rest.split(':')
    const host = decodeURIComponent(hostEncoded)
    if (pathSegments.length === 0) {
      return `https://${host}/.well-known/did.json`
    }
    const path = pathSegments.map(decodeURIComponent).join('/')
    return `https://${host}/${path}/did.json`
  }
  return null
}

/**
 * Heuristic for "is this string shaped like a fully-qualified handle worth
 * resolving?" — used to gate the auto-detect query. Conservative: only
 * triggers on multi-segment domains, never on emails or DIDs.
 */
export function looksLikeHandle(value: string): boolean {
  const v = value.trim().toLowerCase()
  if (!v) return false
  if (v.includes('@')) return false // looks like an email
  if (!v.includes('.')) return false // single-segment, not a full handle
  if (v.startsWith('did:')) return false // already a DID
  return true
}
