import {describe, expect, test} from '@jest/globals'

import {isNetworkError} from '#/lib/network-error'

describe('isNetworkError', () => {
  test.each([
    'Network request failed',
    'TypeError: Failed to fetch',
    'Error: fetch failed: java.net.UnknownHostException',
    'The Internet connection appears to be offline',
    'The network connection was lost',
    'A server with the specified hostname could not be found',
    'TypeError: Network request timed out',
  ])('detects %s', message => {
    expect(isNetworkError(new Error(message))).toBe(true)
  })

  test('checks wrapped error causes', () => {
    const error = new Error('Unable to fulfill XRPC request', {
      cause: new Error('fetch failed: connection closed'),
    })

    expect(isNetworkError(error)).toBe(true)
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
})
