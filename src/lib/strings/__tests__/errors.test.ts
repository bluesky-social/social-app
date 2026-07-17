import {type Procedure, type Query, XrpcResponseError} from '@atproto/lex'
import {describe, expect, it} from '@jest/globals'

import {
  getErrorHeader,
  getErrorName,
  getErrorStatus,
  isXrpcError,
  isXrpcErrorOf,
} from '#/lib/xrpc-error'
import {chat} from '#/lexicons'
import {isErrorMaybeAppPasswordPermissions, isNetworkError} from '../errors'

/**
 * Lex `XrpcResponseError` fixture. Built from a WHATWG `Response` (so
 * `.headers` is a `Headers` object and `.status` is the numeric HTTP status)
 * plus a JSON error payload carrying `.error`.
 */
function lexError(
  status: number,
  error: string,
  headers?: Record<string, string>,
  message = `${error} message`,
) {
  const response = new Response(null, {status, headers})
  const method = {} as Procedure | Query
  return new XrpcResponseError(method, response, {
    encoding: 'application/json',
    body: {error, message},
  })
}

describe('isXrpcError', () => {
  it('matches a lex XrpcResponseError', () => {
    expect(isXrpcError(lexError(400, 'TokenInvalid'))).toBe(true)
  })

  it('rejects non-XRPC values', () => {
    expect(isXrpcError(new Error('boom'))).toBe(false)
    expect(isXrpcError('TokenInvalid')).toBe(false)
    expect(isXrpcError(undefined)).toBe(false)
  })
})

describe('getErrorStatus', () => {
  it('reads status from a lex XrpcResponseError', () => {
    expect(getErrorStatus(lexError(429, 'RateLimitExceeded'))).toBe(429)
  })

  it('returns undefined for non-XRPC values', () => {
    expect(getErrorStatus(new Error('boom'))).toBeUndefined()
  })
})

describe('getErrorName', () => {
  it('reads the lexicon error code', () => {
    expect(getErrorName(lexError(400, 'TokenInvalid'))).toBe('TokenInvalid')
  })

  it('returns undefined for non-XRPC values', () => {
    expect(getErrorName(new Error('boom'))).toBeUndefined()
  })
})

describe('isXrpcErrorOf', () => {
  it('matches a declared error code for the method', () => {
    expect(
      isXrpcErrorOf(
        chat.bsky.convo.acceptConvo,
        lexError(400, 'InvalidConvo'),
        'InvalidConvo',
      ),
    ).toBe(true)
  })

  it('does not match a different error code or a non-XRPC value', () => {
    expect(
      isXrpcErrorOf(
        chat.bsky.convo.getMessages,
        lexError(400, 'InvalidConvo'),
        'InvalidConvo',
      ),
    ).toBe(true)
    expect(
      isXrpcErrorOf(
        chat.bsky.convo.acceptConvo,
        new Error('boom'),
        'InvalidConvo',
      ),
    ).toBe(false)
  })

  it('constrains the error name to the method declared errors at compile time', () => {
    isXrpcErrorOf(
      chat.bsky.convo.acceptConvo,
      lexError(400, 'InvalidConvo'),
      // @ts-expect-error 'Bogus' is not a declared error of acceptConvo
      'Bogus',
    )
  })
})

describe('getErrorHeader', () => {
  it('reads a header from the lex Headers object', () => {
    const e = lexError(429, 'RateLimitExceeded', {'ratelimit-reset': '123'})
    expect(getErrorHeader(e, 'ratelimit-reset')).toBe('123')
    expect(getErrorHeader(e, 'RateLimit-Reset')).toBe('123')
  })

  it('returns undefined for a missing header or non-XRPC value', () => {
    expect(getErrorHeader(lexError(400, 'X'), 'nope')).toBeUndefined()
    expect(getErrorHeader(new Error('boom'), 'ratelimit-reset')).toBeUndefined()
  })
})

describe('isErrorMaybeAppPasswordPermissions', () => {
  /*
   * The PDS wire shape: generic error code `InvalidToken`, with the
   * app-password specifics only in the message ('Bad token scope' from
   * auth-verifier, 'Bad token method' from pipethrough).
   */
  it('matches the InvalidToken + bad-token-message wire shape', () => {
    expect(
      isErrorMaybeAppPasswordPermissions(
        lexError(400, 'InvalidToken', undefined, 'Bad token scope'),
      ),
    ).toBe(true)
    expect(
      isErrorMaybeAppPasswordPermissions(
        lexError(400, 'InvalidToken', undefined, 'Bad token method'),
      ),
    ).toBe(true)
  })

  it('does not match other InvalidToken errors (malformed/expired tokens)', () => {
    expect(
      isErrorMaybeAppPasswordPermissions(
        lexError(400, 'InvalidToken', undefined, 'Malformed token'),
      ),
    ).toBe(false)
  })

  it('still matches the string-based bad-token signals on plain errors', () => {
    expect(
      isErrorMaybeAppPasswordPermissions(new Error('Bad token scope')),
    ).toBe(true)
    expect(
      isErrorMaybeAppPasswordPermissions(new Error('Bad token method')),
    ).toBe(true)
  })

  it('does not match unrelated XRPC errors', () => {
    expect(
      isErrorMaybeAppPasswordPermissions(lexError(400, 'InvalidRequest')),
    ).toBe(false)
  })
})

describe('isNetworkError', () => {
  it('matches known network failure strings', () => {
    expect(isNetworkError(new Error('Network request failed'))).toBe(true)
    expect(isNetworkError('Failed to fetch')).toBe(true)
  })

  it('does not match unrelated errors', () => {
    expect(isNetworkError(new Error('TokenInvalid'))).toBe(false)
  })
})
