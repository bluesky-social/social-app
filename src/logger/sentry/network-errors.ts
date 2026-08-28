import {XrpcResponseError} from '@atproto/lex'
import {type ErrorEvent} from '@sentry/react-native'

import {isNetworkError} from '#/lib/network-error'

const TRANSIENT_UPSTREAM_ERRORS = new Set([
  'UpstreamFailure',
  'NotEnoughResources',
  'UpstreamTimeout',
])

const TRANSIENT_UPSTREAM_MESSAGES = [
  /upstream\s*failure/i,
  /not\s*enough\s*resources/i,
  /upstream\s*timeout/i,
  /operation timed out, please try again/i,
]

/**
 * Sentry should not report expected transport failures or transient upstream
 * availability errors. Keep this narrower than `XrpcError.shouldRetry()`:
 * fetch handlers can wrap implementation bugs, while 429s and generic 500s
 * can reveal actionable client or server regressions.
 */
export function isExpectedSentryNetworkError(value: unknown): boolean {
  if (isNetworkError(value)) {
    return true
  }

  if (
    value instanceof XrpcResponseError &&
    TRANSIENT_UPSTREAM_ERRORS.has(value.error)
  ) {
    return true
  }

  const message = String(value)
  return TRANSIENT_UPSTREAM_MESSAGES.some(pattern => pattern.test(message))
}

/** Global backstop for automatic captures that bypass the logger transport. */
export function dropExpectedNetworkErrors(
  event: ErrorEvent,
  hint: {originalException?: unknown},
): ErrorEvent | null {
  const candidates: unknown[] = [hint.originalException, event.message]

  for (const exception of event.exception?.values ?? []) {
    candidates.push(exception.value)
    if (exception.type && exception.value) {
      candidates.push(`${exception.type}: ${exception.value}`)
    }
  }

  return candidates.some(isExpectedSentryNetworkError) ? null : event
}
