import {type Did} from '@atproto/api'

/**
 * Build the URL where a DID document can be fetched.
 *
 * - did:plc:* -> `${plcDirectory}/${did}`
 * - did:web:host          -> https://host/.well-known/did.json
 * - did:web:host:path:seg -> https://host/path/seg/did.json
 *
 * Returns undefined for unsupported DID methods or malformed input.
 * `localhost` (with optional port) is served over http for local dev.
 */
export function getDidDocumentUrl(
  did: Did,
  plcDirectory: string,
): string | undefined {
  if (did.startsWith('did:plc:')) {
    return `${plcDirectory}/${did}`
  }

  if (!did.startsWith('did:web:')) {
    return undefined
  }

  const msid = did.slice('did:web:'.length)
  if (!msid) {
    return undefined
  }

  const [hostEnc, ...pathSegments] = msid.split(':')
  if (!hostEnc) {
    return undefined
  }

  const host = hostEnc.replace(/%3A/gi, ':')
  const protocol =
    host.startsWith('localhost') &&
    (host.length === 'localhost'.length ||
      host.charAt('localhost'.length) === ':')
      ? 'http'
      : 'https'
  const path =
    pathSegments.length > 0
      ? `/${pathSegments.join('/')}/did.json`
      : '/.well-known/did.json'

  return `${protocol}://${host}${path}`
}
