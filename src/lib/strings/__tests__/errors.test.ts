import {LexError, XrpcResponseError} from '@atproto/lex'
import {beforeAll, describe, expect, it} from '@jest/globals'
import {i18n} from '@lingui/core'

import {cleanError} from '../errors'

/*
 * `cleanError` returns translated copy, so a locale has to be active. With no
 * catalog loaded, Lingui falls back to the source message.
 */
beforeAll(() => {
  i18n.loadAndActivate({locale: 'en', messages: {}})
})

/**
 * A stand-in for the method schema an `XrpcResponseError` is built against.
 * The generated lexicons are not available yet, and `XrpcResponseError` only
 * reads `method` back out for `matchesSchemaErrors()`, which these tests never
 * call - so a minimal object is enough.
 */
const method = {
  nsid: 'com.atproto.server.createAccount',
  type: 'procedure',
  errors: ['HandleNotAvailable'],
} as unknown as ConstructorParameters<typeof XrpcResponseError>[0]

/** An error as the lex client builds one from a JSON error response body. */
function xrpcResponseError(
  error: string,
  message: string,
  status: number = 400,
) {
  return new XrpcResponseError(method, new Response(null, {status}), {
    encoding: 'application/json',
    body: {error, message},
  })
}

/**
 * An error as the lex client builds one from a response with no XRPC error
 * payload: the code is derived from the HTTP status, and the message is a
 * generic overview of the response.
 */
function xrpcStatusError(status: number) {
  return new XrpcResponseError(method, new Response(null, {status}), undefined)
}

describe('cleanError', () => {
  it('surfaces the clean message of a lex error', () => {
    const e = xrpcResponseError('HandleNotAvailable', 'Handle already taken')
    // The raw stringification is class- and code-prefixed, so it must not leak.
    expect(e.toString()).toBe(
      'XrpcResponseError: [HandleNotAvailable] Handle already taken',
    )
    expect(cleanError(e)).toBe('Handle already taken')
  })

  it('falls back to the lexicon code when a lex error has no message', () => {
    // `Error` defaults an absent message to the empty string.
    const e = new LexError('InvalidRequest')
    expect(e.toString()).toBe('LexError: [InvalidRequest] ')
    expect(cleanError(e)).toBe('InvalidRequest')
  })

  it('matches the upstream-failure branch on a lex error code', () => {
    // 502 maps to the space-free `UpstreamFailure` lexicon code.
    const e = xrpcStatusError(502)
    expect(e.error).toBe('UpstreamFailure')
    expect(cleanError(e)).toBe(
      'The server appears to be experiencing issues. Please try again in a few moments.',
    )
  })

  it('matches NotEnoughResources', () => {
    expect(cleanError(xrpcStatusError(503))).toBe(
      'The server appears to be experiencing issues. Please try again in a few moments.',
    )
  })

  it('matches the app-password branch on a lex error message', () => {
    const e = xrpcResponseError('InvalidToken', 'Bad token scope')
    expect(cleanError(e)).toBe(
      'This feature is not available while using an App Password. Please sign in with your main password.',
    )
  })

  it('matches the network-error branch on a lex error message', () => {
    const e = xrpcResponseError('InternalServerError', 'Failed to fetch', 500)
    expect(cleanError(e)).toBe(
      'Unable to connect. Please check your internet connection and try again.',
    )
  })

  it('surfaces the authentication-required code of a lex error', () => {
    /*
     * The lex client derives `AuthenticationRequired` from a 401 with no XRPC
     * payload, where the pre-migration client used the spaced
     * "Authentication Required".
     * Neither is special-cased in `cleanError`, so what matters is that the
     * class- and code-prefixed stringification does not reach the user.
     */
    const e = xrpcStatusError(401)
    expect(e.error).toBe('AuthenticationRequired')
    expect(cleanError(e)).toBe('Upstream server responded with a 401 error')
  })

  it('strips a leading "Error: " from a plain error', () => {
    expect(cleanError(new Error('Something broke'))).toBe('Something broke')
  })

  it('passes strings through', () => {
    expect(cleanError('Something broke')).toBe('Something broke')
    expect(cleanError('')).toBe('')
    expect(cleanError(undefined)).toBe('')
  })
})
