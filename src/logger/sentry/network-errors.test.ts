import {getMain, XrpcInternalError, XrpcResponseError} from '@atproto/lex'
import {describe, expect, test} from '@jest/globals'
import {type ErrorEvent} from '@sentry/react-native'

import {
  dropExpectedNetworkErrors,
  isExpectedSentryNetworkError,
} from '#/logger/sentry/network-errors'
import {com} from '#/lexicons'

const method = getMain(com.atproto.server.describeServer)

/** An `XrpcResponseError` for a response that carried no JSON error payload. */
function statusOnlyError(status: number) {
  return new XrpcResponseError(method, new Response(null, {status}), undefined)
}

/**
 * An `XrpcResponseError` as the PDS pipethrough produces it: the status is
 * rewritten while the upstream lexicon code is forwarded verbatim.
 */
function payloadError(status: number, error: string, message: string) {
  const body = {error, message}
  return new XrpcResponseError(
    method,
    new Response(JSON.stringify(body), {
      status,
      headers: {'content-type': 'application/json'},
    }),
    {encoding: 'application/json', body},
  )
}

function exceptionEvent(type: string, value: string): ErrorEvent {
  return {type: undefined, exception: {values: [{type, value}]}}
}

describe('isExpectedSentryNetworkError', () => {
  test.each([502, 503, 504])('detects transient upstream status %s', status => {
    expect(isExpectedSentryNetworkError(statusOnlyError(status))).toBe(true)
  })

  test.each([429, 500])('keeps actionable HTTP status %s', status => {
    expect(isExpectedSentryNetworkError(statusOnlyError(status))).toBe(false)
  })

  test('detects a pipethrough 502 forwarding an upstream error code', () => {
    const error = payloadError(
      502,
      'InternalServerError',
      'Internal Server Error',
    )

    expect(error.error).toBe('InternalServerError')
    expect(isExpectedSentryNetworkError(error)).toBe(true)
  })

  test('checks the cause of a wrapper that does not embed it', () => {
    expect(
      isExpectedSentryNetworkError(
        new XrpcInternalError(method, undefined, {
          cause: new Error('fetch failed: connection reset'),
        }),
      ),
    ).toBe(true)
  })

  test('keeps implementation errors wrapped by XRPC errors', () => {
    expect(
      isExpectedSentryNetworkError(
        new XrpcInternalError(method, undefined, {
          cause: new TypeError('URL.canParse is not a function'),
        }),
      ),
    ).toBe(false)
  })

  test.each(['UpstreamFailure', 'Upstream Failure', '[UpstreamFailure]'])(
    'detects the transient upstream message %s',
    message => {
      expect(isExpectedSentryNetworkError(message)).toBe(true)
    },
  )

  test.each(['upstreamTimeoutV2', 'handleUpstreamFailureRetry'])(
    'keeps the camelCase identifier %s',
    message => {
      expect(isExpectedSentryNetworkError(message)).toBe(false)
    },
  )
})

describe('dropExpectedNetworkErrors', () => {
  test('drops automatic captures using the original exception', () => {
    /*
     * The serialized values do not carry the cause chain, so the hint is the
     * only place the transport failure is visible.
     */
    const event = exceptionEvent(
      'XrpcInternalError',
      'Unable to fulfill XRPC request',
    )

    expect(
      dropExpectedNetworkErrors(event, {
        originalException: new XrpcInternalError(method, undefined, {
          cause: new Error('fetch failed: connection closed'),
        }),
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

  test('drops a serialized transient upstream error carrying a payload', () => {
    const event = exceptionEvent('XrpcResponseError', 'Upstream Timeout')

    expect(dropExpectedNetworkErrors(event, {})).toBeNull()
  })

  test('drops a serialized transient upstream error with no payload', () => {
    const {message} = statusOnlyError(504)

    // Locks the text lex builds from the status alone, which the filter matches
    expect(message).toBe('Upstream server responded with a 504 error')
    expect(
      dropExpectedNetworkErrors(
        exceptionEvent('XrpcResponseError', message),
        {},
      ),
    ).toBeNull()
  })

  test.each([
    '[USER REPORT] alice.bsky.social video-upload-aborted',
    '[USER REPORT] alice.bsky.social Network request failed',
  ])('keeps the message event %s', message => {
    const event = {type: undefined, message} satisfies ErrorEvent

    expect(dropExpectedNetworkErrors(event, {originalException: message})).toBe(
      event,
    )
  })

  test('keeps non-network events', () => {
    const event = exceptionEvent(
      'XrpcFetchError',
      'Unexpected fetchHandler() error: URL.canParse is not a function',
    )

    expect(dropExpectedNetworkErrors(event, {})).toBe(event)
  })

  test('keeps a camelCase identifier that merely contains an upstream word', () => {
    const event = exceptionEvent('Error', 'checkout failed: upstreamTimeoutV2')

    expect(dropExpectedNetworkErrors(event, {})).toBe(event)
  })
})
