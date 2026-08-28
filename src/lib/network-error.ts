const NETWORK_ERROR_PATTERNS = [
  /\babort(?:ed|error)?\b/i,
  /network request failed/i,
  /failed to fetch/i,
  /fetch failed/i,
  /\bload failed\b/i,
  /upstream service unreachable/i,
  /networkerror when attempting to fetch resource/i,
  /internet connection appears to be offline/i,
  /network connection was lost/i,
  /unknownhostexception/i,
  /unable to resolve host/i,
  /server with the specified hostname could not be found/i,
  /network request timed out/i,
  /connectexception: failed to connect/i,
  /sslhandshakeexception: connection closed/i,
]

/**
 * Detects transport failures across the error strings produced by web, native
 * fetch, and the XRPC clients. Error causes are checked because the XRPC
 * clients wrap the platform-specific fetch error.
 */
export function isNetworkError(value: unknown): boolean {
  return isNetworkErrorInner(value, new Set())
}

function isNetworkErrorInner(value: unknown, seen: Set<object>): boolean {
  if (NETWORK_ERROR_PATTERNS.some(pattern => pattern.test(String(value)))) {
    return true
  }

  if (typeof value !== 'object' || value === null || seen.has(value)) {
    return false
  }

  seen.add(value)
  return 'cause' in value && isNetworkErrorInner(value.cause, seen)
}
