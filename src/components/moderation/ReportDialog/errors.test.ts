import {XrpcResponseError} from '@atproto/lex'

import {com} from '#/lexicons'
import {classifyReportError} from './errors'

/**
 * An error as the lex client builds one from a JSON error response body. The
 * classifier only reads `error`, `message` and `status` back off it.
 */
function xrpcError(status: number, error: string, message: string) {
  return new XrpcResponseError(
    com.atproto.moderation.createReport.main,
    new Response(null, {status}),
    {encoding: 'application/json', body: {error, message}},
  )
}

describe('classifyReportError', () => {
  it('treats account takedown as an expected rejection', () => {
    const result = classifyReportError(
      xrpcError(
        403,
        'AccountTakedown',
        'Report not accepted from takendown account',
      ),
    )

    expect(result).toMatchObject({
      kind: 'account-takedown',
      shouldReport: false,
      fingerprint: ['{{ default }}', 'report-dialog:account-takedown'],
      tags: {
        report_error_kind: 'account-takedown',
        report_error_bucket: 'account-takedown',
        report_xrpc_error: 'AccountTakedown',
        report_http_status: 403,
      },
    })
  })

  it.each([
    {
      error: xrpcError(
        502,
        'InternalServerError',
        'Failed to perform upstream request',
      ),
      bucket: 'upstream-fetch',
    },
    {
      error: xrpcError(502, 'UpstreamFailure', 'Internal Server Error'),
      bucket: 'upstream-internal',
    },
    {
      error: xrpcError(
        502,
        'UpstreamFailure',
        'Upstream server responded with a 502 error',
      ),
      bucket: 'upstream-http-502',
    },
    {
      error: xrpcError(
        504,
        'UpstreamTimeout',
        'Upstream server responded with a 504 error',
      ),
      bucket: 'upstream-http-504',
    },
  ])('classifies $bucket as unavailable', ({error, bucket}) => {
    expect(classifyReportError(error)).toMatchObject({
      kind: 'service-unavailable',
      shouldReport: true,
      fingerprint: ['{{ default }}', `report-dialog:${bucket}`],
    })
  })

  it('classifies an invalid reason type separately', () => {
    const result = classifyReportError(
      xrpcError(
        400,
        'InvalidRequest',
        'Invalid reason type: tools.ozone.report.defs#reasonOther',
      ),
    )

    expect(result).toMatchObject({
      kind: 'invalid-reason-type',
      shouldReport: true,
      fingerprint: ['{{ default }}', 'report-dialog:invalid-reason-type'],
    })
  })

  it.each([400, 404])(
    'separates a non-retryable upstream %i without calling it temporary',
    status => {
      const result = classifyReportError(
        xrpcError(
          502,
          'UpstreamFailure',
          `Upstream server responded with a ${status} error`,
        ),
      )

      expect(result).toMatchObject({
        kind: 'unexpected',
        shouldReport: true,
        fingerprint: ['{{ default }}', `report-dialog:upstream-http-${status}`],
      })
    },
  )

  it('classifies non-XRPC errors as unexpected', () => {
    expect(classifyReportError(new Error('boom'))).toMatchObject({
      kind: 'unexpected',
      shouldReport: true,
      fingerprint: ['{{ default }}', 'report-dialog:unexpected'],
    })
  })
})
