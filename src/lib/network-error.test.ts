import {getMain, XrpcInternalError} from '@atproto/lex'
import {describe, expect, test} from '@jest/globals'

import {AbortError} from '#/lib/async/cancelable'
import {isNetworkError} from '#/lib/network-error'
import {com} from '#/lexicons'

const method = getMain(com.atproto.server.describeServer)

describe('isNetworkError', () => {
  test.each([
    'Network request failed',
    'TypeError: Failed to fetch',
    'Error: fetch failed: java.net.UnknownHostException',
    'Load failed',
    'Error: Upstream service unreachable',
    'NetworkError when attempting to fetch resource',
    'The Internet connection appears to be offline',
    'The network connection was lost',
    'Unable to resolve host "bsky.social": No address associated with hostname',
    'A server with the specified hostname could not be found',
    'TypeError: Network request timed out',
    'ConnectException: Failed to connect to bsky.social/1.2.3.4:443',
    'SSLHandshakeException: Connection closed by peer',
  ])('detects %s', message => {
    expect(isNetworkError(new Error(message))).toBe(true)
  })

  test('detects a cancelled request', () => {
    expect(isNetworkError(new AbortError())).toBe(true)
  })

  test('detects a stringified web abort', () => {
    expect(isNetworkError('AbortError: The user aborted a request.')).toBe(true)
  })

  test.each([
    'MultipartUploadError: Multipart upload aborted',
    'TypeError: undefined is not an object (evaluating abortController.abort)',
  ])('does not treat a lowercase abort as a network error: %s', message => {
    expect(isNetworkError(message)).toBe(false)
  })

  test('checks wrapped error causes', () => {
    const error = new Error('Unable to fulfill XRPC request', {
      cause: new Error('fetch failed: connection closed'),
    })

    expect(isNetworkError(error)).toBe(true)
  })

  test('checks the cause of a wrapper that does not embed it', () => {
    const error = new XrpcInternalError(method, undefined, {
      cause: new Error('fetch failed'),
    })

    expect(error.message).not.toContain('fetch failed')
    expect(isNetworkError(error)).toBe(true)
  })

  test('keeps a wrapper whose cause is not a network error', () => {
    const error = new XrpcInternalError(method, undefined, {
      cause: new TypeError('URL.canParse is not a function'),
    })

    expect(isNetworkError(error)).toBe(false)
  })

  test('does not treat arbitrary fetch-handler failures as network errors', () => {
    expect(
      isNetworkError(
        new Error(
          'Unexpected fetchHandler() error: URL.canParse is not a function',
        ),
      ),
    ).toBe(false)
  })

  test('does not match words ending in load', () => {
    expect(isNetworkError(new Error('Multipart upload failed'))).toBe(false)
  })

  test('terminates on a cycle of causes', () => {
    const a = new Error('first') as Error & {cause?: unknown}
    const b = new Error('second') as Error & {cause?: unknown}
    a.cause = b
    b.cause = a

    expect(isNetworkError(a)).toBe(false)
  })

  test.each([
    ['a null-prototype object', () => Object.create(null)],
    [
      'a value whose toString throws',
      () => ({
        toString() {
          throw new Error('nope')
        },
      }),
    ],
  ])('returns false without throwing for %s', (_label, build) => {
    expect(() => isNetworkError(build())).not.toThrow()
    expect(isNetworkError(build())).toBe(false)
  })
})
