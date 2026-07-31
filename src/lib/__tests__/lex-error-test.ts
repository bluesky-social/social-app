import {XrpcResponseError} from '@atproto/lex-client'
import {LexAuthFactorError} from '@atproto/lex-password-session'
import {describe, expect, it} from '@jest/globals'

import {getErrorName} from '../lex-error'

/**
 * A stand-in for the method schema an `XrpcResponseError` is built against.
 * The generated lexicons are not available yet, and `XrpcResponseError` only
 * reads `method` back out for `matchesSchemaErrors()`, which these tests never
 * call - so a minimal object is enough.
 */
const method = {
  nsid: 'com.atproto.server.createSession',
  type: 'procedure',
  errors: ['AuthFactorTokenRequired'],
} as unknown as ConstructorParameters<typeof XrpcResponseError>[0]

/** An error as the lex client builds one from a JSON error response body. */
function xrpcResponseError(error: string, message: string) {
  return new XrpcResponseError(method, new Response(null, {status: 400}), {
    encoding: 'application/json',
    body: {error, message},
  })
}

describe('getErrorName', () => {
  it('returns the lexicon error code of an XRPC response error', () => {
    const e = xrpcResponseError('InvalidToken', 'Bad token scope')
    expect(getErrorName(e)).toBe('InvalidToken')
  })

  it('returns AuthFactorTokenRequired for a LexAuthFactorError', () => {
    /*
     * The 2FA case: `PasswordSession.login` throws this, and it extends
     * `LexError` WITHOUT being an `XrpcError` - the reason `getErrorName` is
     * gated on `LexError`.
     */
    const cause = xrpcResponseError(
      'AuthFactorTokenRequired',
      'A sign in code has been sent to your email address',
    )
    expect(getErrorName(new LexAuthFactorError(cause))).toBe(
      'AuthFactorTokenRequired',
    )
  })

  it('returns undefined for non-lex errors', () => {
    expect(getErrorName(new Error('InvalidToken'))).toBeUndefined()
    expect(getErrorName('InvalidToken')).toBeUndefined()
    expect(getErrorName(null)).toBeUndefined()
    expect(getErrorName(undefined)).toBeUndefined()
  })
})
