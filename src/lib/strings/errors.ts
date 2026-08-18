import {LexError} from '@atproto/lex'
import {t} from '@lingui/core/macro'

import {isXrpcError} from '#/lib/xrpc-error'

/**
 * The text to show the user when no special case applies.
 *
 * A `LexError` stringifies as `Class: [ErrorCode] message` (for example
 * `XrpcResponseError: [HandleNotAvailable] Handle already taken`), so its
 * `toString()` is never fit for display. Its `message` is the server's
 * human-readable text, so prefer that and fall back to the lexicon code for the
 * errors that carry no message.
 *
 * Everything else keeps the historical behaviour of stringifying and dropping a
 * leading `Error: `.
 */
function toDisplayString(e: unknown, str: string): string {
  if (e instanceof LexError) {
    return e.message || e.error
  }
  if (str.startsWith('Error: ')) {
    return str.slice('Error: '.length)
  }
  return str
}

export function cleanError(e: unknown): string {
  if (!e) {
    return ''
  }
  /*
   * Match against the full stringification rather than the display text: it
   * contains the error name and the lexicon code as well as the message, so a
   * single check covers both error shapes.
   */
  // oxlint-disable-next-line typescript/no-base-to-string
  const str = typeof e === 'string' ? e : e.toString()
  if (isNetworkError(str)) {
    return t`Unable to connect. Please check your internet connection and try again.`
  }
  /*
   * The legacy client named these with spaces ("Upstream Failure"); lexicon error
   * codes are space-free ("UpstreamFailure"). Match both while the app throws
   * both shapes.
   */
  if (
    str.includes('Upstream Failure') ||
    str.includes('UpstreamFailure') ||
    str.includes('NotEnoughResources') ||
    str.includes('pipethrough network error')
  ) {
    return t`The server appears to be experiencing issues. Please try again in a few moments.`
  }
  /**
   * @see https://github.com/bluesky-social/atproto/blob/255cfcebb54332a7129af768a93004e22c6858e3/packages/pds/src/actor-store/preference/transactor.ts#L24
   */
  if (
    str.includes('Do not have authorization to set preferences') &&
    str.includes('app.bsky.actor.defs#personalDetailsPref')
  ) {
    return t`You cannot update your birthdate while using an app password. Please sign in with your main password to update your birthdate.`
  }
  if (str.includes('Bad token scope') || str.includes('Bad token method')) {
    return t`This feature is not available while using an App Password. Please sign in with your main password.`
  }
  if (str.includes('Account has been suspended')) {
    return t`Account has been suspended`
  }
  if (str.includes('Account is deactivated')) {
    return t`Account is deactivated`
  }
  if (str.includes('Profile not found')) {
    return t`Profile not found`
  }
  if (str.includes('Unable to resolve handle')) {
    return t`Unable to resolve handle`
  }
  return toDisplayString(e, str)
}

const NETWORK_ERRORS = [
  'Abort',
  'Network request failed',
  'Failed to fetch',
  'Load failed',
  'Upstream service unreachable',
  'NetworkError when attempting to fetch resource',
]

export function isNetworkError(e: unknown) {
  const str = String(e)
  for (const err of NETWORK_ERRORS) {
    if (str.includes(err)) {
      return true
    }
  }
  return false
}

/**
 * The PDS answers an app-password-scope rejection with the lexicon code
 * `InvalidToken` and a message of 'Bad token scope' or 'Bad token method'
 * (pipethrough), so the typed path matches the code AND the message. The
 * pre-migration check compared against 'TokenInvalid', which the PDS never
 * sends - the string fallback was doing all the work.
 */
export function isErrorMaybeAppPasswordPermissions(e: unknown) {
  if (isXrpcError(e)) {
    return (
      e.error === 'InvalidToken' &&
      (e.message.includes('Bad token scope') ||
        e.message.includes('Bad token method'))
    )
  }
  const str = String(e)
  return str.includes('Bad token scope') || str.includes('Bad token method')
}

/**
 * Intended to capture "User cancelled" or "Crop cancelled" errors
 * that we often get from expo modules such @bsky.app/expo-image-crop-tool
 *
 * The exact name has changed in the past so let's just see if the string
 * contains "cancel"
 */
export function isCancelledError(e: unknown) {
  const str = String(e).toLowerCase()
  return str.includes('cancel')
}

// TODO Replace this with error.shouldRetry() when available. -dsb
const RETRYABLE_ERRORS = [408, 425, 429, 500, 502, 503, 504, 522, 524]
export function isRetryableHttpStatus(status: number) {
  return RETRYABLE_ERRORS.includes(status)
}

export function shouldRetryError(e: unknown) {
  return isXrpcError(e) && e.shouldRetry()
}
