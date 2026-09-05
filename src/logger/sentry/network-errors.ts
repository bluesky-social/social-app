import {XrpcResponseError} from '@atproto/lex'
import {type ErrorEvent} from '@sentry/react-native'

import {isNetworkError, safeStringify} from '#/lib/network-error'

/**
 * Upstream-unavailable statuses. Matched on the status, not the lexicon
 * code: the PDS pipethrough rewrites the status to 502 but forwards the
 * upstream code verbatim, so a 502 can arrive named `InternalServerError`.
 * `#/lib/xrpc-error` is deliberately not imported - it pulls `#/lexicons`
 * into the module graph evaluated before `Sentry.init()`.
 */
const TRANSIENT_UPSTREAM_STATUSES = new Set([502, 503, 504])

/**
 * Sentry serializes `error.message`, not `toString()`, so these match the
 * message text: the payload message ("Upstream Timeout"), the lexicon code
 * ("UpstreamFailure"), and lex's payload-less "Upstream server responded with
 * a 504 error". Word boundaries keep camelCase identifiers from matching.
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
 * Message events are skipped: Sentry sets `hint.originalException` to the
 * message string for `captureMessage`, and the only message producers are the
 * logger transport (already filtered) and user bug reports (never droppable).
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
