/**
 * Tangled string links look like:
 *   https://tangled.org/strings/{actor}/{rkey}
 * (also tangled.sh) where {actor} is the owner (handle or DID) and {rkey} is
 * the rkey of their `sh.tangled.string` record. The DID form contains colons
 * but never a slash, so the `[^/]+` actor group captures it intact.
 */
const TANGLED_STRING_RE =
  /^https?:\/\/tangled\.(?:org|sh)\/strings\/([^/]+)\/([^/?#]+)/i

export type TangledStringRef = {
  /** Handle or DID of the owner, taken verbatim from the URL. */
  actor: string
  rkey: string
}

export function parseTangledString(url: string): TangledStringRef | null {
  const match = TANGLED_STRING_RE.exec(url)
  if (!match) return null
  const [, actor, rkey] = match
  if (!actor || !rkey) return null
  return {actor: decodeURIComponent(actor), rkey}
}

export function isTangledStringUrl(url: string): boolean {
  return parseTangledString(url) !== null
}
