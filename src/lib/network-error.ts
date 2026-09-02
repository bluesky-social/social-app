const NETWORK_ERROR_PATTERNS = [
  /*
   * Case-sensitive on purpose. `AbortError` (web `DOMException`) and the
   * `Aborted` message thrown by `#/lib/async/cancelable` are transport
   * cancellations, but the lowercase word shows up in unrelated failures - a
   * multipart upload the service marked `aborted`, or a `TypeError` naming
   * `abortController.abort` - which must still be reported.
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
 * `String(value)` runs code we do not control - a custom `toString`, a
 * `Symbol.toPrimitive`, a `Proxy` trap - and throws outright for a
 * null-prototype object, so stringifying an arbitrary thrown value can itself
 * throw. Returning `undefined` lets callers treat an unreadable value as "not a
 * network error" rather than letting the throw escape `logger.error()` or
 * Sentry's `beforeSend`, where it would lose the original report.
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
 * Never throws: reading `cause` off a hostile value can throw just like
 * stringifying it can, and a throw here would escape whatever error path is
 * asking the question.
 */
export function isNetworkError(value: unknown): boolean {
  try {
    return isNetworkErrorInner(value, undefined)
  } catch {
    return false
  }
}

/**
 * `seen` stays undefined until the first recursion into an object cause, so the
 * common case (a string or an error with no cause) allocates nothing.
 */
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
