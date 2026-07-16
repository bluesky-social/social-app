import {XRPCError} from '@atproto/api'
import {
  type Procedure,
  type Query,
  XrpcResponseError,
} from '@atproto/lex-client'
import {describe, expect, it} from '@jest/globals'

import {
  getErrorHeader,
  getErrorName,
  getErrorStatus,
  isXrpcError,
} from '#/lib/xrpc-error'
import {isErrorMaybeAppPasswordPermissions, isNetworkError} from '../errors'

/**
 * Old-world fixture: `@atproto/api` XRPCError. `.headers` is a plain record,
 * `.error` is the lexicon code string, `.status` a numeric ResponseType enum.
 */
function oldError(
  status: number,
  error: string,
  headers?: Record<string, string>,
) {
  return new XRPCError(status, error, undefined, headers)
}

/**
 * New-world fixture: lex `XrpcResponseError`. Built from a WHATWG `Response`
 * (so `.headers` is a `Headers` object and `.status` is the numeric HTTP
 * status) plus a JSON error payload carrying `.error`.
 */
function lexError(
  status: number,
  error: string,
  headers?: Record<string, string>,
) {
  const response = new Response(null, {status, headers})
  const method = {} as Procedure | Query
  return new XrpcResponseError(method, response, {
    encoding: 'application/json',
    body: {error, message: `${error} message`},
  })
}

describe('isXrpcError', () => {
  it('matches both old XRPCError and lex XrpcResponseError', () => {
    expect(isXrpcError(oldError(400, 'TokenInvalid'))).toBe(true)
    expect(isXrpcError(lexError(400, 'TokenInvalid'))).toBe(true)
  })

  it('rejects non-XRPC values', () => {
    expect(isXrpcError(new Error('boom'))).toBe(false)
    expect(isXrpcError('TokenInvalid')).toBe(false)
    expect(isXrpcError(undefined)).toBe(false)
  })
})

describe('getErrorStatus', () => {
  it('reads status from both worlds', () => {
    expect(typeof getErrorStatus(oldError(400, 'TokenInvalid'))).toBe('number')
    expect(getErrorStatus(lexError(429, 'RateLimitExceeded'))).toBe(429)
  })

  it('returns undefined for non-XRPC values', () => {
    expect(getErrorStatus(new Error('boom'))).toBeUndefined()
  })
})

describe('getErrorName', () => {
  it('reads the lexicon error code from both worlds', () => {
    expect(getErrorName(oldError(400, 'TokenInvalid'))).toBe('TokenInvalid')
    expect(getErrorName(lexError(400, 'TokenInvalid'))).toBe('TokenInvalid')
  })

  it('returns undefined for non-XRPC values', () => {
    expect(getErrorName(new Error('boom'))).toBeUndefined()
  })
})

describe('getErrorHeader', () => {
  it('reads a header from the old record shape (case-insensitive)', () => {
    const e = oldError(429, 'RateLimitExceeded', {'ratelimit-reset': '123'})
    expect(getErrorHeader(e, 'ratelimit-reset')).toBe('123')
    expect(getErrorHeader(e, 'RateLimit-Reset')).toBe('123')
  })

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
  it('matches a TokenInvalid error from both worlds', () => {
    expect(
      isErrorMaybeAppPasswordPermissions(oldError(400, 'TokenInvalid')),
    ).toBe(true)
    expect(
      isErrorMaybeAppPasswordPermissions(lexError(400, 'TokenInvalid')),
    ).toBe(true)
  })

  it('still matches the string-based bad-token signals', () => {
    expect(
      isErrorMaybeAppPasswordPermissions(new Error('Bad token scope')),
    ).toBe(true)
    expect(
      isErrorMaybeAppPasswordPermissions(new Error('Bad token method')),
    ).toBe(true)
  })

  it('does not match unrelated XRPC errors', () => {
    expect(
      isErrorMaybeAppPasswordPermissions(oldError(400, 'InvalidRequest')),
    ).toBe(false)
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
