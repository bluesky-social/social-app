import {XrpcResponseError} from '@atproto/lex'
import {type ErrorEvent} from '@sentry/react-native'

import {isNetworkError, safeStringify} from '#/lib/network-error'

/**
 * HTTP statuses that mean an upstream service was unavailable.
 *
 * Matched on the status rather than the lexicon code because the code is not
 * reliable here: the PDS pipethrough rewrites the status to 502 while
 * forwarding the upstream error code verbatim, so an upstream 500 arrives as a
 * 502 still named `InternalServerError`. The status is authoritative.
 *
 * `#/lib/xrpc-error` is deliberately not used for the `instanceof` check - it
 * imports `#/lexicons`, which would pull the whole lexicon graph into the
 * module evaluated before `Sentry.init()`.
 */
const TRANSIENT_UPSTREAM_STATUSES = new Set([502, 503, 504])

/**
 * Sentry serializes an exception as `{type: error.name, value: error.message}`,
 * so these match the message text rather than the `toString()`. Lex builds that
 * message from the server's error payload ("Upstream Timeout") or, when the
 * response carries no JSON payload, from the status alone ("Upstream server
 * responded with a 504 error").
 *
 * The optional space matches the spaced prose and the space-free lexicon code
 * ("UpstreamFailure") alike, and the word boundaries keep camelCase
 * identifiers such as `upstreamTimeoutV2` from matching.
 */
const TRANSIENT_UPSTREAM_MESSAGES = [
  /\bupstream\s?failure\b/i,
  /\bnot\s?enough\s?resources\b/i,
  /\bupstream\s?timeout\b/i,
  /operation timed out, please try again/i,
  /\bupstream server responded with a 50[234] error\b/i,
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
    TRANSIENT_UPSTREAM_STATUSES.has(value.status)
  ) {
    return true
  }

  const message = safeStringify(value)
  return (
    message !== undefined &&
    TRANSIENT_UPSTREAM_MESSAGES.some(pattern => pattern.test(message))
  )
}

/**
 * Global backstop for automatic captures that bypass the logger transport.
 *
 * Only exception events are inspected. Sentry sets `hint.originalException` to
 * the message *string* for a `captureMessage`, and message events reach Sentry
 * from exactly two places: the logger transport, which has already run this
 * check before capturing, and user bug reports, which must never be dropped
 * for happening to contain a word like "aborted" in the report slug.
 */
export function dropExpectedNetworkErrors(
  event: ErrorEvent,
  hint: {originalException?: unknown},
): ErrorEvent | null {
  const exceptions = event.exception?.values
  if (!exceptions?.length) {
    return event
  }

  const candidates: unknown[] = [hint.originalException]

  for (const exception of exceptions) {
    candidates.push(exception.value)
    if (exception.type && exception.value) {
      candidates.push(`${exception.type}: ${exception.value}`)
    }
  }

  return candidates.some(isExpectedSentryNetworkError) ? null : event
}
