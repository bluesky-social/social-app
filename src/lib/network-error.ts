const NETWORK_ERROR_PATTERNS = [
  /*
   * Case-sensitive: `AbortError` and `Aborted` are cancellations, but the
   * lowercase word appears in unrelated failures ("Multipart upload aborted")
   * that must still be reported.
   */
  /\bAbort(?:ed|Error)?\b/,
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
 * `String()` can throw - null-prototype objects, custom `toString`, proxies -
 * so an unreadable value counts as "not a network error" rather than crashing
 * the error path that asked.
 */
export function safeStringify(value: unknown): string | undefined {
  try {
    // oxlint-disable-next-line typescript/no-base-to-string
    return String(value)
  } catch {
    return undefined
  }
}

/**
 * Detects transport failures across the error strings produced by web, native
 * fetch, and the XRPC clients. Error causes are checked because the XRPC
 * clients wrap the platform-specific fetch error.
 *
 * Never throws; see {@link safeStringify}.
 */
export function isNetworkError(value: unknown): boolean {
  try {
    return isNetworkErrorInner(value, undefined)
  } catch {
    return false
  }
}

function isNetworkErrorInner(
  value: unknown,
  seen: Set<object> | undefined,
): boolean {
  const message = safeStringify(value)
  if (
    message !== undefined &&
    NETWORK_ERROR_PATTERNS.some(pattern => pattern.test(message))
  ) {
    return true
  }

  if (typeof value !== 'object' || value === null || seen?.has(value)) {
    return false
  }
  if (!('cause' in value)) {
    return false
  }

  const nextSeen = seen ?? new Set<object>()
  nextSeen.add(value)
  return isNetworkErrorInner(value.cause, nextSeen)
}
