import {
  getMain,
  type Procedure,
  type Query,
  XrpcInternalError,
  XrpcResponseError,
} from '@atproto/lex'
import {describe, expect, it} from '@jest/globals'

import {app, com} from '#/lexicons'
import {matchXrpcError} from '../xrpc-error'

const createAccount = com.atproto.server.createAccount
const getTrends = app.bsky.unspecced.getTrends

/**
 * An `XrpcResponseError` as a lex `Client` would construct it: the method
 * schema it was thrown for, plus the server's error response and its parsed
 * payload.
 */
function responseError(method: Procedure | Query, error: string, status = 400) {
  return new XrpcResponseError(
    method,
    new Response(JSON.stringify({error}), {
      status,
      headers: {'content-type': 'application/json'},
    }),
    {encoding: 'application/json', body: {error}},
  )
}

describe('matchXrpcError', () => {
  it('returns a code declared by the method', () => {
    const e = responseError(getMain(createAccount), 'InvalidHandle')
    expect(matchXrpcError(e, createAccount)).toBe('InvalidHandle')
  })

  it('accepts the .main schema as well as the namespace', () => {
    const e = responseError(getMain(createAccount), 'InvalidInviteCode')
    expect(matchXrpcError(e, createAccount.main)).toBe('InvalidInviteCode')
  })

  it('returns undefined for a code the method does not declare', () => {
    const e = responseError(getMain(createAccount), 'RateLimitExceeded')
    expect(matchXrpcError(e, createAccount)).toBeUndefined()
  })

  it('returns undefined for a method that declares no errors at all', () => {
    const e = responseError(getMain(getTrends), 'InvalidHandle')
    expect(matchXrpcError(e, getTrends)).toBeUndefined()
  })

  it('does not match a declared code thrown for a different method', () => {
    /*
     * `InvalidHandle` is declared by createAccount but this error came from a
     * getTrends call, so scoping must reject it.
     */
    const e = responseError(getMain(getTrends), 'InvalidHandle')
    expect(matchXrpcError(e, createAccount)).toBeUndefined()
  })

  it('returns undefined for a lex error carrying no server code', () => {
    const e = new XrpcInternalError(getMain(createAccount), 'boom')
    expect(matchXrpcError(e, createAccount)).toBeUndefined()
  })

  it('returns undefined for non-lex errors and non-errors', () => {
    expect(matchXrpcError(new Error('InvalidHandle'), createAccount)).toBe(
      undefined,
    )
    expect(matchXrpcError('InvalidHandle', createAccount)).toBeUndefined()
    expect(matchXrpcError(undefined, createAccount)).toBeUndefined()
  })

  it('narrows the result to the declared-errors union', () => {
    const e = responseError(getMain(createAccount), 'InvalidHandle')
    const code = matchXrpcError(e, createAccount)

    /*
     * A misspelled or undeclared code is not comparable to the narrowed union,
     * which is what makes a typo'd `switch` case a compile error (TS2678 /
     * TS2367) rather than a branch that never runs.
     */
    // @ts-expect-error 'InvalidHandel' is not a declared createAccount error
    expect(code === 'InvalidHandel').toBe(false)
    // @ts-expect-error 'RateLimitExceeded' is not declared by createAccount
    expect(code === 'RateLimitExceeded').toBe(false)

    expect(code === 'UnsupportedDomain').toBe(false)
  })
})
