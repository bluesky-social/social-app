import {type Procedure, XrpcFetchError, XrpcResponseError} from '@atproto/lex'
import {describe, expect, test} from '@jest/globals'
import {type ErrorEvent} from '@sentry/react-native'

import {
  dropExpectedNetworkErrors,
  isExpectedSentryNetworkError,
} from '#/logger/sentry/network-errors'

const method = {
  nsid: 'app.bsky.test.getTest',
  type: 'query',
} as unknown as Procedure

function xrpcResponseError(status: number) {
  return new XrpcResponseError(method, new Response(null, {status}), undefined)
}

describe('isExpectedSentryNetworkError', () => {
  test.each([502, 503, 504])('detects transient upstream status %s', status => {
    expect(isExpectedSentryNetworkError(xrpcResponseError(status))).toBe(true)
  })

  test.each([429, 500])('keeps actionable HTTP status %s', status => {
    expect(isExpectedSentryNetworkError(xrpcResponseError(status))).toBe(false)
  })

  test('checks an XRPC fetch error cause', () => {
    expect(
      isExpectedSentryNetworkError(
        new XrpcFetchError(method, new Error('fetch failed: connection reset')),
      ),
    ).toBe(true)
  })

  test('keeps implementation errors wrapped by XRPC fetch errors', () => {
    expect(
      isExpectedSentryNetworkError(
        new XrpcFetchError(
          method,
          new TypeError('URL.canParse is not a function'),
        ),
      ),
    ).toBe(false)
  })
})

describe('dropExpectedNetworkErrors', () => {
  test('drops automatic captures using the original exception', () => {
    const event = {type: undefined} satisfies ErrorEvent

    expect(
      dropExpectedNetworkErrors(event, {
        originalException: new Error('fetch failed: connection closed'),
      }),
    ).toBeNull()
  })

  test('checks every exception in a linked error chain', () => {
    const event = {
      type: undefined,
      exception: {
        values: [
          {type: 'Error', value: 'Network request failed'},
          {
            type: 'XrpcInternalError',
            value: 'Unable to fulfill XRPC request',
          },
        ],
      },
    } satisfies ErrorEvent

    expect(dropExpectedNetworkErrors(event, {})).toBeNull()
  })

  test('drops serialized transient upstream errors', () => {
    const event = {
      type: undefined,
      exception: {
        values: [{type: 'XrpcResponseError', value: 'Upstream Timeout'}],
      },
    } satisfies ErrorEvent

    expect(dropExpectedNetworkErrors(event, {})).toBeNull()
  })

  test('keeps non-network events', () => {
    const event = {
      type: undefined,
      exception: {
        values: [
          {
            type: 'XrpcFetchError',
            value: 'URL.canParse is not a function',
          },
        ],
      },
    } satisfies ErrorEvent

    expect(dropExpectedNetworkErrors(event, {})).toBe(event)
  })
})
