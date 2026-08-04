import {XRPCError} from '@atproto/api'

import {isRetryableHttpStatus, shouldRetryError} from '#/lib/strings/errors'

export type ReportErrorKind =
  | 'account-takedown'
  | 'invalid-reason-type'
  | 'service-unavailable'
  | 'unexpected'

export type ReportErrorClassification = {
  kind: ReportErrorKind
  shouldReport: boolean
  fingerprint: string[]
  tags: Record<string, string | number>
}

export function classifyReportError(error: unknown): ReportErrorClassification {
  if (!(error instanceof XRPCError)) {
    return classification('unexpected', 'unexpected', true)
  }

  const xrpcTags = {
    report_xrpc_error: error.error,
    report_http_status: error.status,
  }

  if (error.error === 'AccountTakedown') {
    return classification(
      'account-takedown',
      'account-takedown',
      false,
      xrpcTags,
    )
  }

  if (error.message.startsWith('Invalid reason type')) {
    return classification(
      'invalid-reason-type',
      'invalid-reason-type',
      true,
      xrpcTags,
    )
  }

  if (error.message === 'Failed to perform upstream request') {
    return classification(
      'service-unavailable',
      'upstream-fetch',
      true,
      xrpcTags,
    )
  }

  if (error.message === 'Internal Server Error') {
    return classification(
      'service-unavailable',
      'upstream-internal',
      true,
      xrpcTags,
    )
  }

  const upstreamStatus = error.message.match(
    /^Upstream server responded with a (\d{3}) error$/,
  )?.[1]
  if (upstreamStatus) {
    return classification(
      isRetryableHttpStatus(Number(upstreamStatus))
        ? 'service-unavailable'
        : 'unexpected',
      `upstream-http-${upstreamStatus}`,
      true,
      xrpcTags,
    )
  }

  if (shouldRetryError(error)) {
    return classification(
      'service-unavailable',
      `xrpc-retryable-${error.status}`,
      true,
      xrpcTags,
    )
  }

  return classification(
    'unexpected',
    `xrpc-other-${error.status}`,
    true,
    xrpcTags,
  )
}

function classification(
  kind: ReportErrorKind,
  bucket: string,
  shouldReport: boolean,
  tags: Record<string, string | number> = {},
): ReportErrorClassification {
  return {
    kind,
    shouldReport,
    fingerprint: ['{{ default }}', `report-dialog:${bucket}`],
    tags: {
      report_error_kind: kind,
      report_error_bucket: bucket,
      ...tags,
    },
  }
}
